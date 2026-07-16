import { mutation } from "./_generated/server";

export const seed = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("workspaces").first();
    if (existing) return { status: "already_seeded" };

    const workspaceId = await ctx.db.insert("workspaces", {
      name: "My Life",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const areas = [
      { name: "College", icon: "graduation", color: "#7654e8" },
      { name: "Freelancing", icon: "briefcase", color: "#3d72e5" },
      { name: "Projects", icon: "folder", color: "#44a95f" },
      { name: "Business", icon: "chart", color: "#f1a007" },
      { name: "Personal", icon: "user", color: "#ed6977" },
      { name: "Health", icon: "leaf", color: "#16a6a3" },
    ];

    for (const a of areas) {
      await ctx.db.insert("areas", {
        workspaceId,
        ...a,
        archived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { status: "seeded", workspaceId };
  },
});
