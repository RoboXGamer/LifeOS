import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin, requireWorkspaceOwner } from "./lib/auth";

export const seedAreas = mutation({
  args: {},
  returns: v.object({
    status: v.union(v.literal("already_seeded"), v.literal("seeded")),
  }),
  handler: async (ctx) => {
    const profile = await requireAdmin(ctx);
    if (!profile.activeWorkspaceId)
      throw new Error("Select a Workspace first.");
    await requireWorkspaceOwner(ctx, profile.activeWorkspaceId);

    const existing = await ctx.db
      .query("areas")
      .withIndex("by_workspaceId", (q) =>
        q.eq("workspaceId", profile.activeWorkspaceId!),
      )
      .first();
    if (existing) return { status: "already_seeded" as const };

    const areas = [
      { name: "College", icon: "graduation", color: "#7654e8" },
      { name: "Freelancing", icon: "briefcase", color: "#3d72e5" },
      { name: "Projects", icon: "folder", color: "#44a95f" },
      { name: "Business", icon: "chart", color: "#f1a007" },
      { name: "Personal", icon: "user", color: "#ed6977" },
      { name: "Health", icon: "leaf", color: "#16a6a3" },
    ];
    const now = Date.now();
    for (const area of areas) {
      await ctx.db.insert("areas", {
        workspaceId: profile.activeWorkspaceId,
        ...area,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    return { status: "seeded" as const };
  },
});
