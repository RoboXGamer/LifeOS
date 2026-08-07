import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireWorkspaceOwner } from "./lib/auth";
import { cleanTagName } from "./lib/validation";
import { tagDoc } from "./lib/validators";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(tagDoc),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const tags = await ctx.db
      .query("tags")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .take(200);
    return tags.sort((a, b) =>
      a.normalizedName.localeCompare(b.normalizedName),
    );
  },
});

export const listWithCounts = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(
    v.object({
      ...tagDoc.fields,
      itemCount: v.number(),
      countIsLimited: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const tags = await ctx.db
      .query("tags")
      .withIndex("by_workspaceId", (q) => q.eq("workspaceId", args.workspaceId))
      .take(200);
    return await Promise.all(
      tags
        .sort((a, b) => a.normalizedName.localeCompare(b.normalizedName))
        .map(async (tag) => {
          const links = await ctx.db
            .query("itemTags")
            .withIndex("by_workspaceId_and_tagId", (q) =>
              q.eq("workspaceId", args.workspaceId).eq("tagId", tag._id),
            )
            .take(301);
          return {
            ...tag,
            itemCount: Math.min(links.length, 300),
            countIsLimited: links.length > 300,
          };
        }),
    );
  },
});

export const rename = mutation({
  args: { tagId: v.id("tags"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get("tags", args.tagId);
    if (!tag) throw new Error("Tag not found.");
    await requireWorkspaceOwner(ctx, tag.workspaceId);
    const clean = cleanTagName(args.name);
    const collision = await ctx.db
      .query("tags")
      .withIndex("by_workspaceId_and_normalizedName", (q) =>
        q
          .eq("workspaceId", tag.workspaceId)
          .eq("normalizedName", clean.normalizedName),
      )
      .unique();
    if (collision && collision._id !== tag._id) {
      throw new Error("That Tag already exists in this Workspace.");
    }
    await ctx.db.patch("tags", tag._id, clean);
    return null;
  },
});

export const remove = mutation({
  args: { tagId: v.id("tags") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const tag = await ctx.db.get("tags", args.tagId);
    if (!tag) return null;
    await requireWorkspaceOwner(ctx, tag.workspaceId);
    const link = await ctx.db
      .query("itemTags")
      .withIndex("by_tagId", (q) => q.eq("tagId", tag._id))
      .first();
    if (link)
      throw new Error("Remove this Tag from its Items before deleting it.");
    await ctx.db.delete("tags", tag._id);
    return null;
  },
});
