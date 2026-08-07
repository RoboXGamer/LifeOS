import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { financialState, itemStatus, itemType } from "./lib/validators";

export default defineSchema({
  waitlist: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  profiles: defineTable({
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
  })
    .index("by_authUserId", ["authUserId"])
    .index("by_normalizedUsername", ["normalizedUsername"])
    .index("by_role", ["role"]),

  workspaces: defineTable({
    ownerId: v.optional(v.id("profiles")),
    name: v.string(),
    archived: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_ownerId", ["ownerId"])
    .index("by_ownerId_and_archived", ["ownerId", "archived"]),

  areas: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_archived", ["workspaceId", "archived"]),

  items: defineTable({
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
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_areaId", ["workspaceId", "areaId"])
    .index("by_workspaceId_and_archived", ["workspaceId", "archived"])
    .index("by_areaId_and_archived", ["areaId", "archived"])
    .index("by_parentId", ["parentId"])
    .index("by_workspaceId_and_dueDate", ["workspaceId", "dueDate"])
    .index("by_areaId_and_dueDate", ["areaId", "dueDate"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["workspaceId", "archived"],
    }),

  tags: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    normalizedName: v.string(),
    createdAt: v.number(),
  })
    .index("by_workspaceId", ["workspaceId"])
    .index("by_workspaceId_and_normalizedName", [
      "workspaceId",
      "normalizedName",
    ]),

  itemTags: defineTable({
    workspaceId: v.id("workspaces"),
    itemId: v.id("items"),
    tagId: v.id("tags"),
    createdAt: v.number(),
  })
    .index("by_itemId", ["itemId"])
    .index("by_tagId", ["tagId"])
    .index("by_workspaceId_and_itemId", ["workspaceId", "itemId"])
    .index("by_workspaceId_and_tagId", ["workspaceId", "tagId"]),
});
