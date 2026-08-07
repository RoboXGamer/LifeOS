import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const join = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  returns: v.object({
    status: v.union(v.literal("existing"), v.literal("created")),
  }),
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();

    if (name.length < 2 || name.length > 80)
      throw new Error("Please enter a valid name.");
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Please enter a valid email address.");

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (query) => query.eq("email", email))
      .unique();

    if (existing) return { status: "existing" as const };

    await ctx.db.insert("waitlist", {
      name,
      email,
      createdAt: Date.now(),
    });

    return { status: "created" as const };
  },
});
