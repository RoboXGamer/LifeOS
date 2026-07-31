import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireProfile, requireWorkspaceOwner } from "./lib/auth";
import {
  cleanColor,
  cleanDescription,
  cleanIcon,
  cleanName,
} from "./lib/validation";

const areaFields = {
  name: v.string(),
  description: v.optional(v.string()),
  icon: v.string(),
  color: v.string(),
};

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    return await ctx.db
      .query("areas")
      .withIndex("by_workspaceId_and_archived", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("archived", false),
      )
      .take(100);
  },
});

export const listArchived = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    return await ctx.db
      .query("areas")
      .withIndex("by_workspaceId_and_archived", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("archived", true),
      )
      .take(100);
  },
});

export const create = mutation({
  args: { workspaceId: v.id("workspaces"), ...areaFields },
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const now = Date.now();
    return await ctx.db.insert("areas", {
      workspaceId: args.workspaceId,
      name: cleanName(args.name, "Area name"),
      description: cleanDescription(args.description),
      icon: cleanIcon(args.icon),
      color: cleanColor(args.color),
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: { areaId: v.id("areas"), ...areaFields },
  handler: async (ctx, args) => {
    const area = await ctx.db.get("areas", args.areaId);
    if (!area) throw new Error("Area not found.");
    await requireWorkspaceOwner(ctx, area.workspaceId);
    await ctx.db.patch("areas", area._id, {
      name: cleanName(args.name, "Area name"),
      description: cleanDescription(args.description),
      icon: cleanIcon(args.icon),
      color: cleanColor(args.color),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setArchived = mutation({
  args: { areaId: v.id("areas"), archived: v.boolean() },
  handler: async (ctx, args) => {
    const area = await ctx.db.get("areas", args.areaId);
    if (!area) throw new Error("Area not found.");
    await requireWorkspaceOwner(ctx, area.workspaceId);
    await ctx.db.patch("areas", area._id, {
      archived: args.archived,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const removalImpact = query({
  args: { areaId: v.id("areas") },
  handler: async (ctx, args) => {
    await requireProfile(ctx);
    const area = await ctx.db.get("areas", args.areaId);
    if (!area) return { itemCount: 0, tooLarge: false };
    await requireWorkspaceOwner(ctx, area.workspaceId);
    const items = await ctx.db
      .query("items")
      .withIndex("by_workspaceId_and_areaId", (q) =>
        q.eq("workspaceId", area.workspaceId).eq("areaId", area._id),
      )
      .take(501);
    return { itemCount: items.length, tooLarge: items.length > 500 };
  },
});

export const remove = mutation({
  args: { areaId: v.id("areas"), confirmation: v.string() },
  handler: async (ctx, args) => {
    const area = await ctx.db.get("areas", args.areaId);
    if (!area) throw new Error("Area not found.");
    await requireWorkspaceOwner(ctx, area.workspaceId);
    if (!area.archived)
      throw new Error("Archive this Area before deleting it.");
    if (args.confirmation.trim() !== area.name) {
      throw new Error("Type the Area name exactly to confirm deletion.");
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_workspaceId_and_areaId", (q) =>
        q.eq("workspaceId", area.workspaceId).eq("areaId", area._id),
      )
      .take(501);
    if (items.length > 500) {
      throw new Error("This Area is too large for immediate deletion.");
    }
    for (const item of items) {
      const links = await ctx.db
        .query("itemTags")
        .withIndex("by_itemId", (q) => q.eq("itemId", item._id))
        .take(100);
      for (const link of links) await ctx.db.delete("itemTags", link._id);
      await ctx.db.delete("items", item._id);
    }
    await ctx.db.delete("areas", area._id);
    return null;
  },
});
