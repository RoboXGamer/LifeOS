import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfile, requireWorkspaceOwner } from "./lib/auth";
import { cleanName } from "./lib/validation";
import { workspaceDoc } from "./lib/validators";

const defaultTags = [
  "urgent",
  "waiting",
  "recurring",
  "idea",
  "reference",
  "client",
  "order",
];

export const list = query({
  args: {},
  returns: v.object({
    activeWorkspaceId: v.union(v.id("workspaces"), v.null()),
    workspaces: v.array(
      v.object({
        id: v.id("workspaces"),
        name: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  }),
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    const workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", profile._id))
      .take(100);
    return {
      activeWorkspaceId: profile.activeWorkspaceId ?? null,
      workspaces: workspaces
        .filter((workspace) => !workspace.archived)
        .map((workspace) => ({
          id: workspace._id,
          name: workspace.name,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        })),
    };
  },
});

export const listArchived = query({
  args: {},
  returns: v.array(workspaceDoc),
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    return await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId_and_archived", (q) =>
        q.eq("ownerId", profile._id).eq("archived", true),
      )
      .take(100);
  },
});

export const create = mutation({
  args: { name: v.string() },
  returns: v.id("workspaces"),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", profile._id))
      .take(101);
    if (existing.length >= 100) {
      throw new Error("A profile can have at most 100 Workspaces.");
    }
    const now = Date.now();
    const workspaceId = await ctx.db.insert("workspaces", {
      ownerId: profile._id,
      name: cleanName(args.name, "Workspace name"),
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
    for (const name of defaultTags) {
      await ctx.db.insert("tags", {
        workspaceId,
        name,
        normalizedName: name,
        createdAt: now,
      });
    }
    await ctx.db.patch("profiles", profile._id, {
      activeWorkspaceId: workspaceId,
      updatedAt: now,
    });
    return workspaceId;
  },
});

export const rename = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    name: v.string(),
    expectedUpdatedAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { workspace } = await requireWorkspaceOwner(ctx, args.workspaceId);
    if (workspace.updatedAt !== args.expectedUpdatedAt) {
      throw new Error(
        "This Workspace changed elsewhere. Reopen the menu and try again.",
      );
    }
    await ctx.db.patch("workspaces", workspace._id, {
      name: cleanName(args.name, "Workspace name"),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const select = mutation({
  args: { workspaceId: v.id("workspaces") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile, workspace } = await requireWorkspaceOwner(
      ctx,
      args.workspaceId,
    );
    if (workspace.archived) throw new Error("Restore this Workspace first.");
    await ctx.db.patch("profiles", profile._id, {
      activeWorkspaceId: workspace._id,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setArchived = mutation({
  args: { workspaceId: v.id("workspaces"), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile, workspace } = await requireWorkspaceOwner(
      ctx,
      args.workspaceId,
    );
    if (args.archived) {
      const active = await ctx.db
        .query("workspaces")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", profile._id))
        .take(100);
      if (active.filter((candidate) => !candidate.archived).length <= 1) {
        throw new Error("Keep at least one active Workspace.");
      }
    }
    await ctx.db.patch("workspaces", workspace._id, {
      archived: args.archived,
      updatedAt: Date.now(),
    });
    if (args.archived && profile.activeWorkspaceId === workspace._id) {
      const fallback = await ctx.db
        .query("workspaces")
        .withIndex("by_ownerId", (q) => q.eq("ownerId", profile._id))
        .take(100);
      const next = fallback.find(
        (candidate) => candidate._id !== workspace._id && !candidate.archived,
      );
      if (next) {
        await ctx.db.patch("profiles", profile._id, {
          activeWorkspaceId: next._id,
          updatedAt: Date.now(),
        });
      }
    }
    return null;
  },
});

export const removalImpact = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.object({
    areaCount: v.number(),
    itemCount: v.number(),
    tooLarge: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireProfile(ctx);
    const workspace = await ctx.db.get("workspaces", args.workspaceId);
    if (!workspace) {
      return { areaCount: 0, itemCount: 0, tooLarge: false };
    }
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const [areas, items] = await Promise.all([
      ctx.db
        .query("areas")
        .withIndex("by_workspaceId", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .take(501),
      ctx.db
        .query("items")
        .withIndex("by_workspaceId", (q) =>
          q.eq("workspaceId", args.workspaceId),
        )
        .take(501),
    ]);
    return {
      areaCount: areas.length,
      itemCount: items.length,
      tooLarge: areas.length > 500 || items.length > 500,
    };
  },
});

export const remove = mutation({
  args: { workspaceId: v.id("workspaces"), confirmation: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { profile, workspace } = await requireWorkspaceOwner(
      ctx,
      args.workspaceId,
    );
    if (!workspace.archived) {
      throw new Error("Archive this Workspace before deleting it.");
    }
    if (args.confirmation.trim() !== workspace.name) {
      throw new Error("Type the Workspace name exactly to confirm deletion.");
    }

    const [areas, items, tags, itemTags] = await Promise.all([
      ctx.db
        .query("areas")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .take(501),
      ctx.db
        .query("items")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .take(501),
      ctx.db
        .query("tags")
        .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspace._id))
        .take(501),
      ctx.db
        .query("itemTags")
        .withIndex("by_workspaceId_and_itemId", (q) =>
          q.eq("workspaceId", workspace._id),
        )
        .take(501),
    ]);
    if (
      areas.length > 500 ||
      items.length > 500 ||
      tags.length > 500 ||
      itemTags.length > 500
    ) {
      throw new Error("This Workspace is too large for immediate deletion.");
    }
    for (const link of itemTags) await ctx.db.delete("itemTags", link._id);
    for (const item of items) await ctx.db.delete("items", item._id);
    for (const tag of tags) await ctx.db.delete("tags", tag._id);
    for (const area of areas) await ctx.db.delete("areas", area._id);
    await ctx.db.delete("workspaces", workspace._id);
    if (profile.activeWorkspaceId === workspace._id) {
      await ctx.db.patch("profiles", profile._id, {
        activeWorkspaceId: undefined,
        updatedAt: Date.now(),
      });
    }
    return null;
  },
});
