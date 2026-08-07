import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { requireProfile } from "./lib/auth";
import { cleanUsername } from "./lib/validation";

const defaultTags = [
  "urgent",
  "waiting",
  "recurring",
  "idea",
  "reference",
  "client",
  "order",
];

export const linkAnonymousAccount = internalMutation({
  args: {
    anonymousAuthUserId: v.string(),
    permanentAuthUserId: v.string(),
    username: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const anonymousProfile = await ctx.db
      .query("profiles")
      .withIndex("by_authUserId", (q) =>
        q.eq("authUserId", args.anonymousAuthUserId),
      )
      .unique();
    if (!anonymousProfile) return null;

    const permanentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_authUserId", (q) =>
        q.eq("authUserId", args.permanentAuthUserId),
      )
      .unique();
    const now = Date.now();
    const username = args.username ? cleanUsername(args.username) : undefined;
    const email = args.email?.trim().toLowerCase() || undefined;

    if (!permanentProfile) {
      await ctx.db.patch("profiles", anonymousProfile._id, {
        authUserId: args.permanentAuthUserId,
        username,
        normalizedUsername: username,
        email,
        isAnonymous: false,
        updatedAt: now,
      });
      return null;
    }

    const anonymousWorkspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", anonymousProfile._id))
      .take(100);
    const permanentWorkspaceCount = await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", permanentProfile._id))
      .take(101);
    if (permanentWorkspaceCount.length + anonymousWorkspaces.length > 100) {
      throw new Error(
        "These accounts have too many Workspaces to combine safely.",
      );
    }
    for (const workspace of anonymousWorkspaces) {
      await ctx.db.patch("workspaces", workspace._id, {
        ownerId: permanentProfile._id,
        updatedAt: now,
      });
    }
    await ctx.db.delete("profiles", anonymousProfile._id);
    return null;
  },
});

export const bootstrap = mutation({
  args: {},
  returns: v.object({
    profile: v.object({
      id: v.id("profiles"),
      username: v.union(v.string(), v.null()),
      email: v.union(v.string(), v.null()),
      isAnonymous: v.boolean(),
      role: v.union(v.literal("user"), v.literal("admin")),
    }),
    activeWorkspaceId: v.union(v.id("workspaces"), v.null()),
  }),
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) throw new Error("Authentication required.");

    const authUserId = String(authUser._id);
    const authFields = authUser as typeof authUser & {
      username?: string | null;
      isAnonymous?: boolean | null;
    };
    const normalizedUsername = authFields.username?.trim().toLowerCase();
    const email = authUser.email?.trim().toLowerCase();
    const now = Date.now();

    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_authUserId", (q) => q.eq("authUserId", authUserId))
      .unique();

    if (!profile) {
      const profileId = await ctx.db.insert("profiles", {
        authUserId,
        username: normalizedUsername || undefined,
        normalizedUsername: normalizedUsername || undefined,
        email: email || undefined,
        isAnonymous: authFields.isAnonymous === true,
        role: "user",
        suspended: false,
        createdAt: now,
        updatedAt: now,
      });
      profile = (await ctx.db.get("profiles", profileId))!;
    } else {
      const patch = {
        username: normalizedUsername || profile.username,
        normalizedUsername: normalizedUsername || profile.normalizedUsername,
        email: email || profile.email,
        isAnonymous: authFields.isAnonymous === true,
        updatedAt: now,
      };
      await ctx.db.patch("profiles", profile._id, patch);
      profile = { ...profile, ...patch };
    }
    if (!profile) throw new Error("Life OS profile could not be created.");
    const profileId = profile._id;

    let workspaces = await ctx.db
      .query("workspaces")
      .withIndex("by_ownerId", (q) => q.eq("ownerId", profileId))
      .take(100);

    if (workspaces.length === 0) {
      const workspaceId = await ctx.db.insert("workspaces", {
        ownerId: profile._id,
        name: "My Life",
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
      profile = { ...profile, activeWorkspaceId: workspaceId, updatedAt: now };
      workspaces = [(await ctx.db.get("workspaces", workspaceId))!];
    }

    const activeWorkspace =
      workspaces.find(
        (workspace) =>
          workspace._id === profile.activeWorkspaceId && !workspace.archived,
      ) ?? workspaces.find((workspace) => !workspace.archived);

    if (activeWorkspace && activeWorkspace._id !== profile.activeWorkspaceId) {
      await ctx.db.patch("profiles", profile._id, {
        activeWorkspaceId: activeWorkspace._id,
        updatedAt: now,
      });
    }

    return {
      profile: {
        id: profile._id,
        username: profile.username ?? null,
        email: profile.email ?? null,
        isAnonymous: profile.isAnonymous,
        role: profile.role,
      },
      activeWorkspaceId: activeWorkspace?._id ?? null,
    };
  },
});

export const current = query({
  args: {},
  returns: v.object({
    id: v.id("profiles"),
    username: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
    isAnonymous: v.boolean(),
    role: v.union(v.literal("user"), v.literal("admin")),
    activeWorkspaceId: v.union(v.id("workspaces"), v.null()),
    usernameChangedAt: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    return {
      id: profile._id,
      username: profile.username ?? null,
      email: profile.email ?? null,
      isAnonymous: profile.isAnonymous,
      role: profile.role,
      activeWorkspaceId: profile.activeWorkspaceId ?? null,
      usernameChangedAt: profile.usernameChangedAt ?? null,
    };
  },
});

export const changeUsername = mutation({
  args: { username: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const profile = await requireProfile(ctx);
    const username = cleanUsername(args.username);
    const now = Date.now();
    const cooldown = 7 * 24 * 60 * 60 * 1000;
    if (
      profile.usernameChangedAt &&
      now - profile.usernameChangedAt < cooldown
    ) {
      const availableAt = new Date(
        profile.usernameChangedAt + cooldown,
      ).toISOString();
      throw new Error(`Username can be changed again after ${availableAt}.`);
    }
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_normalizedUsername", (q) =>
        q.eq("normalizedUsername", username),
      )
      .unique();
    if (existing && existing._id !== profile._id) {
      throw new Error("That username is already taken.");
    }
    await ctx.db.patch("profiles", profile._id, {
      username,
      normalizedUsername: username,
      usernameChangedAt: now,
      updatedAt: now,
    });
    return null;
  },
});
