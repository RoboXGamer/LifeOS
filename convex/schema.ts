import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  waitlist: defineTable({
    name: v.string(),
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  workspaces: defineTable({
    name: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  areas: defineTable({
    workspaceId: v.id("workspaces"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_workspace", ["workspaceId"]),

  items: defineTable({
    workspaceId: v.id("workspaces"),
    title: v.string(),
    areaId: v.union(v.id("areas"), v.null()),
    color: v.string(),
    type: v.string(),
    status: v.optional(v.string()),
    priority: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    amount: v.optional(v.number()),
    isSettled: v.optional(v.boolean()),
    description: v.optional(v.string()),
    tags: v.array(v.string()),
    parentId: v.union(v.id("items"), v.null()),
    archived: v.boolean(),
    favorite: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_area", ["areaId"])
    .index("by_parent", ["parentId"])
    .index("by_dueDate", ["dueDate"])
    .index("by_area_archived", ["areaId", "archived"]),
});
