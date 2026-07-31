import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";
import { requireProfile } from "./lib/auth";

const defaultTags = [
  "urgent",
  "waiting",
  "recurring",
  "idea",
  "reference",
  "client",
  "order",
];

export const bootstrap = mutation({
  args: {},
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
  handler: async (ctx) => {
    const profile = await requireProfile(ctx);
    return {
      id: profile._id,
      username: profile.username ?? null,
      email: profile.email ?? null,
      isAnonymous: profile.isAnonymous,
      role: profile.role,
      activeWorkspaceId: profile.activeWorkspaceId ?? null,
    };
  },
});
