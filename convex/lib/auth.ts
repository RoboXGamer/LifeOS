import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";

type DatabaseCtx = QueryCtx | MutationCtx;

export async function requireProfile(
  ctx: DatabaseCtx,
): Promise<Doc<"profiles">> {
  const authUser = await authComponent.getAuthUser(ctx);
  if (!authUser) throw new Error("Authentication required.");

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_authUserId", (q) => q.eq("authUserId", String(authUser._id)))
    .unique();

  if (!profile) throw new Error("Life OS profile is not ready.");
  if (profile.suspended) throw new Error("This account is suspended.");
  return profile;
}

export async function requireAdmin(ctx: DatabaseCtx): Promise<Doc<"profiles">> {
  const profile = await requireProfile(ctx);
  if (profile.role !== "admin")
    throw new Error("Administrator access required.");
  return profile;
}

export const requireActiveProfile = requireProfile;

export async function requireWorkspaceOwner(
  ctx: DatabaseCtx,
  workspaceId: Doc<"workspaces">["_id"],
): Promise<{ profile: Doc<"profiles">; workspace: Doc<"workspaces"> }> {
  const profile = await requireProfile(ctx);
  const workspace = await ctx.db.get("workspaces", workspaceId);
  if (!workspace || workspace.ownerId !== profile._id) {
    throw new Error("Workspace not found.");
  }
  return { profile, workspace };
}

export async function requireAreaOwner(
  ctx: DatabaseCtx,
  areaId: Doc<"areas">["_id"],
): Promise<{
  profile: Doc<"profiles">;
  workspace: Doc<"workspaces">;
  area: Doc<"areas">;
}> {
  const area = await ctx.db.get("areas", areaId);
  if (!area) throw new Error("Area not found.");
  const ownership = await requireWorkspaceOwner(ctx, area.workspaceId);
  return { ...ownership, area };
}

export async function requireItemOwner(
  ctx: DatabaseCtx,
  itemId: Doc<"items">["_id"],
): Promise<{
  profile: Doc<"profiles">;
  workspace: Doc<"workspaces">;
  item: Doc<"items">;
}> {
  const item = await ctx.db.get("items", itemId);
  if (!item) throw new Error("Item not found.");
  const ownership = await requireWorkspaceOwner(ctx, item.workspaceId);
  return { ...ownership, item };
}
