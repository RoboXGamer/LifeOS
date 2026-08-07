import { v } from "convex/values";

export const itemType = v.union(
  v.literal("Task"),
  v.literal("Note"),
  v.literal("Event"),
  v.literal("Expense"),
  v.literal("Income"),
);

export const itemStatus = v.union(
  v.literal("Todo"),
  v.literal("In Progress"),
  v.literal("Done"),
);

export const financialState = v.union(
  v.literal("Planned"),
  v.literal("Spent"),
  v.literal("Expected"),
  v.literal("Received"),
);

export const profileDoc = v.object({
  _id: v.id("profiles"),
  _creationTime: v.number(),
  authUserId: v.string(),
  username: v.optional(v.string()),
  normalizedUsername: v.optional(v.string()),
  email: v.optional(v.string()),
  isAnonymous: v.boolean(),
  role: v.union(v.literal("user"), v.literal("admin")),
  suspended: v.boolean(),
  activeWorkspaceId: v.optional(v.id("workspaces")),
  usernameChangedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const workspaceDoc = v.object({
  _id: v.id("workspaces"),
  _creationTime: v.number(),
  ownerId: v.optional(v.id("profiles")),
  name: v.string(),
  archived: v.optional(v.boolean()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const areaDoc = v.object({
  _id: v.id("areas"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  name: v.string(),
  icon: v.string(),
  color: v.string(),
  description: v.optional(v.string()),
  archived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const itemDoc = v.object({
  _id: v.id("items"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  title: v.string(),
  areaId: v.union(v.id("areas"), v.null()),
  type: v.optional(itemType),
  status: v.optional(itemStatus),
  priority: v.optional(v.union(v.literal(1), v.literal(2), v.literal(3))),
  dueDate: v.optional(v.string()),
  amount: v.optional(v.number()),
  financialState: v.optional(financialState),
  description: v.optional(v.string()),
  parentId: v.union(v.id("items"), v.null()),
  archived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const itemView = v.object({
  ...itemDoc.fields,
  tags: v.array(v.string()),
});

export const tagDoc = v.object({
  _id: v.id("tags"),
  _creationTime: v.number(),
  workspaceId: v.id("workspaces"),
  name: v.string(),
  normalizedName: v.string(),
  createdAt: v.number(),
});
