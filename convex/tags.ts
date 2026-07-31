import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireWorkspaceOwner } from "./lib/auth";

export const list = query({
  args: { workspaceId: v.id("workspaces") },
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
