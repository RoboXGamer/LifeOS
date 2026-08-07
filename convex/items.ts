import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import {
  requireAreaOwner,
  requireItemOwner,
  requireProfile,
  requireWorkspaceOwner,
} from "./lib/auth";
import {
  cleanAmount,
  cleanDescription,
  cleanDueDate,
  cleanTagName,
  cleanTitle,
} from "./lib/validation";
import {
  financialState,
  itemStatus,
  itemType,
  itemView,
} from "./lib/validators";

const nullableFinancialState = v.union(financialState, v.null());
const nullableItemType = v.union(itemType, v.null());
const nullableItemStatus = v.union(itemStatus, v.null());
const nullablePriority = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.null(),
);

const itemInput = {
  title: v.string(),
  areaId: v.union(v.id("areas"), v.null()),
  type: nullableItemType,
  status: nullableItemStatus,
  priority: nullablePriority,
  dueDate: v.union(v.string(), v.null()),
  amount: v.union(v.number(), v.null()),
  financialState: nullableFinancialState,
  description: v.union(v.string(), v.null()),
  parentId: v.union(v.id("items"), v.null()),
  tags: v.array(v.string()),
};

type ItemType = "Task" | "Note" | "Event" | "Expense" | "Income";
type FinancialState = "Planned" | "Spent" | "Expected" | "Received";
type ItemStatus = "Todo" | "In Progress" | "Done";
type ItemInput = {
  title: string;
  areaId: Id<"areas"> | null;
  type: ItemType | null;
  status: ItemStatus | null;
  priority: 1 | 2 | 3 | null;
  dueDate: string | null;
  amount: number | null;
  financialState: FinancialState | null;
  description: string | null;
  parentId: Id<"items"> | null;
  tags: string[];
};

type DatabaseCtx = QueryCtx | MutationCtx;

async function itemWithTags(ctx: DatabaseCtx, item: Doc<"items">) {
  const links = await ctx.db
    .query("itemTags")
    .withIndex("by_itemId", (q) => q.eq("itemId", item._id))
    .take(24);
  const tags = (
    await Promise.all(links.map((link) => ctx.db.get("tags", link.tagId)))
  )
    .filter((tag): tag is Doc<"tags"> => tag !== null)
    .map((tag) => tag.name);
  return { ...item, tags };
}

async function visibleAreaIds(ctx: QueryCtx, workspaceId: Id<"workspaces">) {
  const areas = await ctx.db
    .query("areas")
    .withIndex("by_workspaceId_and_archived", (q) =>
      q.eq("workspaceId", workspaceId).eq("archived", false),
    )
    .take(100);
  return new Set(areas.map((area) => area._id));
}

async function validateLocation(
  ctx: DatabaseCtx,
  workspaceId: Id<"workspaces">,
  areaId: Id<"areas"> | null,
  type: ItemType | null,
) {
  if (!areaId) return;
  if (!type) throw new Error("Choose an Item type before assigning an Area.");
  const { area } = await requireAreaOwner(ctx, areaId);
  if (area.workspaceId !== workspaceId || area.archived) {
    throw new Error("Area not found.");
  }
}

function normalizedFields(input: ItemInput) {
  const type = input.type ?? undefined;
  const description = cleanDescription(input.description ?? undefined);
  const shared = {
    title: cleanTitle(input.title),
    type,
    priority: input.priority ?? undefined,
    dueDate: cleanDueDate(input.dueDate),
    description,
  };
  if (type === "Task") {
    return {
      ...shared,
      status: input.status ?? "Todo",
      amount: undefined,
      financialState: undefined,
    };
  }
  if (type === "Expense" || type === "Income") {
    const defaultState = type === "Expense" ? "Planned" : "Expected";
    const financialState = input.financialState ?? defaultState;
    if (
      (type === "Expense" &&
        financialState !== "Planned" &&
        financialState !== "Spent") ||
      (type === "Income" &&
        financialState !== "Expected" &&
        financialState !== "Received")
    ) {
      throw new Error(`Choose a valid ${type} status.`);
    }
    return {
      ...shared,
      status: undefined,
      amount: cleanAmount(input.amount),
      financialState,
    };
  }
  return {
    ...shared,
    status: undefined,
    amount: undefined,
    financialState: undefined,
  };
}

async function setItemTags(
  ctx: MutationCtx,
  itemId: Id<"items">,
  workspaceId: Id<"workspaces">,
  values: string[],
) {
  if (values.length > 12) throw new Error("Use no more than 12 tags per Item.");
  const normalized = [
    ...new Map(
      values.map((value) => {
        const tag = cleanTagName(value);
        return [tag.normalizedName, tag] as const;
      }),
    ).values(),
  ];
  const existingLinks = await ctx.db
    .query("itemTags")
    .withIndex("by_itemId", (q) => q.eq("itemId", itemId))
    .take(100);
  for (const link of existingLinks) await ctx.db.delete("itemTags", link._id);

  let tagCount: number | undefined;
  for (const value of normalized) {
    let tag = await ctx.db
      .query("tags")
      .withIndex("by_workspaceId_and_normalizedName", (q) =>
        q
          .eq("workspaceId", workspaceId)
          .eq("normalizedName", value.normalizedName),
      )
      .unique();
    if (!tag) {
      if (tagCount === undefined) {
        tagCount = (
          await ctx.db
            .query("tags")
            .withIndex("by_workspaceId", (q) =>
              q.eq("workspaceId", workspaceId),
            )
            .take(201)
        ).length;
      }
      if (tagCount >= 200) {
        throw new Error("A Workspace can have at most 200 Tags.");
      }
      const tagId = await ctx.db.insert("tags", {
        workspaceId,
        name: value.name,
        normalizedName: value.normalizedName,
        createdAt: Date.now(),
      });
      tagCount += 1;
      tag = (await ctx.db.get("tags", tagId))!;
    }
    await ctx.db.insert("itemTags", {
      workspaceId,
      itemId,
      tagId: tag._id,
      createdAt: Date.now(),
    });
  }
}

async function family(ctx: DatabaseCtx, item: Doc<"items">) {
  const rootId = item.parentId ?? item._id;
  const root = item.parentId ? await ctx.db.get("items", rootId) : item;
  if (!root) throw new Error("Parent Item not found.");
  const children = await ctx.db
    .query("items")
    .withIndex("by_parentId", (q) => q.eq("parentId", rootId))
    .take(100);
  return { root, children };
}

async function requireItemCapacity(
  ctx: MutationCtx,
  workspaceId: Id<"workspaces">,
) {
  const existing = await ctx.db
    .query("items")
    .withIndex("by_workspaceId", (q) => q.eq("workspaceId", workspaceId))
    .take(501);
  if (existing.length >= 500) {
    throw new Error("A Workspace can have at most 500 Items in V1.");
  }
}

export const list = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const [items, areaIds] = await Promise.all([
      ctx.db
        .query("items")
        .withIndex("by_workspaceId_and_archived", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("archived", false),
        )
        .take(300),
      visibleAreaIds(ctx, args.workspaceId),
    ]);
    const visible = items.filter(
      (item) => item.areaId === null || areaIds.has(item.areaId),
    );
    return await Promise.all(visible.map((item) => itemWithTags(ctx, item)));
  },
});

export const listArchived = query({
  args: { workspaceId: v.id("workspaces") },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const items = await ctx.db
      .query("items")
      .withIndex("by_workspaceId_and_archived", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("archived", true),
      )
      .take(300);
    return await Promise.all(items.map((item) => itemWithTags(ctx, item)));
  },
});

export const listByArea = query({
  args: { areaId: v.id("areas") },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    const { area } = await requireAreaOwner(ctx, args.areaId);
    if (area.archived) return [];
    const items = await ctx.db
      .query("items")
      .withIndex("by_areaId_and_archived", (q) =>
        q.eq("areaId", area._id).eq("archived", false),
      )
      .take(300);
    return await Promise.all(items.map((item) => itemWithTags(ctx, item)));
  },
});

export const listToday = query({
  args: { workspaceId: v.id("workspaces"), date: v.string() },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const date = cleanDueDate(args.date);
    if (!date) return [];
    const [items, areaIds] = await Promise.all([
      ctx.db
        .query("items")
        .withIndex("by_workspaceId_and_dueDate", (q) =>
          q.eq("workspaceId", args.workspaceId).eq("dueDate", date),
        )
        .take(300),
      visibleAreaIds(ctx, args.workspaceId),
    ]);
    const visible = items.filter(
      (item) =>
        !item.archived && (item.areaId === null || areaIds.has(item.areaId)),
    );
    return await Promise.all(visible.map((item) => itemWithTags(ctx, item)));
  },
});

export const listUpcoming = query({
  args: {
    workspaceId: v.id("workspaces"),
    afterDate: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const afterDate = cleanDueDate(args.afterDate);
    if (!afterDate) return [];
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 150), 200));
    const [items, areaIds] = await Promise.all([
      ctx.db
        .query("items")
        .withIndex("by_workspaceId_and_dueDate", (q) =>
          q.eq("workspaceId", args.workspaceId).gt("dueDate", afterDate),
        )
        .take(limit),
      visibleAreaIds(ctx, args.workspaceId),
    ]);
    const visible = items.filter(
      (item) =>
        !item.archived &&
        (item.type === "Task" || item.type === "Event") &&
        (item.areaId === null || areaIds.has(item.areaId)),
    );
    return await Promise.all(visible.map((item) => itemWithTags(ctx, item)));
  },
});

export const listAreaRange = query({
  args: {
    areaId: v.id("areas"),
    fromDate: v.string(),
    toDate: v.string(),
  },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    const { area } = await requireAreaOwner(ctx, args.areaId);
    if (area.archived) return [];
    const fromDate = cleanDueDate(args.fromDate);
    const toDate = cleanDueDate(args.toDate);
    if (!fromDate || !toDate || fromDate > toDate) {
      throw new Error("Choose a valid calendar range.");
    }
    const items = await ctx.db
      .query("items")
      .withIndex("by_areaId_and_dueDate", (q) =>
        q
          .eq("areaId", area._id)
          .gte("dueDate", fromDate)
          .lte("dueDate", toDate),
      )
      .take(200);
    return await Promise.all(
      items
        .filter((item) => !item.archived)
        .map((item) => itemWithTags(ctx, item)),
    );
  },
});

export const search = query({
  args: {
    workspaceId: v.id("workspaces"),
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.array(itemView),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    const searchTerm = args.searchTerm.trim();
    if (!searchTerm) return [];
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 40), 60));
    const [items, areaIds] = await Promise.all([
      ctx.db
        .query("items")
        .withSearchIndex("search_title", (q) =>
          q
            .search("title", searchTerm)
            .eq("workspaceId", args.workspaceId)
            .eq("archived", false),
        )
        .take(limit),
      visibleAreaIds(ctx, args.workspaceId),
    ]);
    return await Promise.all(
      items
        .filter((item) => item.areaId === null || areaIds.has(item.areaId))
        .map((item) => itemWithTags(ctx, item)),
    );
  },
});

export const get = query({
  args: { itemId: v.id("items") },
  returns: itemView,
  handler: async (ctx, args) => {
    const { item } = await requireItemOwner(ctx, args.itemId);
    return await itemWithTags(ctx, item);
  },
});

export const quickCapture = mutation({
  args: { workspaceId: v.id("workspaces"), title: v.string() },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    await requireItemCapacity(ctx, args.workspaceId);
    const now = Date.now();
    return await ctx.db.insert("items", {
      workspaceId: args.workspaceId,
      title: cleanTitle(args.title),
      areaId: null,
      parentId: null,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const create = mutation({
  args: { workspaceId: v.id("workspaces"), ...itemInput },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    await requireWorkspaceOwner(ctx, args.workspaceId);
    await requireItemCapacity(ctx, args.workspaceId);
    let areaId = args.areaId;
    let parentId = args.parentId;
    if (parentId) {
      const { item: parent } = await requireItemOwner(ctx, parentId);
      if (
        parent.workspaceId !== args.workspaceId ||
        parent.parentId ||
        parent.archived
      ) {
        throw new Error("Choose a top-level active parent Item.");
      }
      areaId = parent.areaId;
    }
    await validateLocation(ctx, args.workspaceId, areaId, args.type);
    const now = Date.now();
    const fields = normalizedFields({ ...args, areaId, parentId });
    const itemId = await ctx.db.insert("items", {
      workspaceId: args.workspaceId,
      areaId,
      parentId,
      archived: false,
      createdAt: now,
      updatedAt: now,
      ...fields,
    });
    await setItemTags(ctx, itemId, args.workspaceId, args.tags);
    return itemId;
  },
});

export const update = mutation({
  args: {
    itemId: v.id("items"),
    expectedUpdatedAt: v.number(),
    ...itemInput,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { item } = await requireItemOwner(ctx, args.itemId);
    if (item.updatedAt !== args.expectedUpdatedAt) {
      throw new Error("This Item changed elsewhere. Reopen it and try again.");
    }
    const currentFamily = await family(ctx, item);
    let areaId = args.areaId;
    let parentId = args.parentId;

    if (item.parentId && areaId !== item.areaId) {
      if (areaId !== null) {
        throw new Error("Move the parent Item to move this family.");
      }
      parentId = null;
    }
    const ownChildren = item.parentId ? [] : currentFamily.children;

    if (ownChildren.length > 0 && parentId) {
      throw new Error("An Item with children cannot become a child.");
    }
    if (parentId) {
      const { item: parent } = await requireItemOwner(ctx, parentId);
      if (
        parent._id === item._id ||
        parent.workspaceId !== item.workspaceId ||
        parent.parentId ||
        parent.archived
      ) {
        throw new Error("Choose a top-level active parent Item.");
      }
      areaId = parent.areaId;
    }
    await validateLocation(ctx, item.workspaceId, areaId, args.type);
    const now = Date.now();
    const fields = normalizedFields({ ...args, areaId, parentId });
    await ctx.db.patch("items", item._id, {
      areaId,
      parentId,
      updatedAt: now,
      ...fields,
    });
    if (!item.parentId && areaId !== item.areaId) {
      for (const child of currentFamily.children) {
        await ctx.db.patch("items", child._id, { areaId, updatedAt: now });
      }
    }
    await setItemTags(ctx, item._id, item.workspaceId, args.tags);
    return null;
  },
});

export const setTaskDone = mutation({
  args: { itemId: v.id("items"), done: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { item } = await requireItemOwner(ctx, args.itemId);
    if (item.type !== "Task") throw new Error("Only Tasks can be completed.");
    await ctx.db.patch("items", item._id, {
      status: args.done ? "Done" : "Todo",
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const setArchived = mutation({
  args: { itemId: v.id("items"), archived: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { item } = await requireItemOwner(ctx, args.itemId);
    const { root, children } = await family(ctx, item);
    const members = item.parentId ? [item] : [root, ...children];
    const now = Date.now();
    for (const member of members) {
      await ctx.db.patch("items", member._id, {
        archived: args.archived,
        updatedAt: now,
      });
    }
    return null;
  },
});

export const removalImpact = query({
  args: { itemId: v.id("items") },
  returns: v.object({
    rootId: v.id("items"),
    rootTitle: v.string(),
    itemCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireProfile(ctx);
    const item = await ctx.db.get("items", args.itemId);
    if (!item) {
      return {
        rootId: args.itemId,
        rootTitle: "",
        itemCount: 0,
      };
    }
    await requireWorkspaceOwner(ctx, item.workspaceId);
    const { root, children } = await family(ctx, item);
    const target = item.parentId ? item : root;
    const members = item.parentId ? [item] : [root, ...children];
    return {
      rootId: target._id,
      rootTitle: target.title,
      itemCount: members.length,
    };
  },
});

export const remove = mutation({
  args: { itemId: v.id("items"), confirmation: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { item } = await requireItemOwner(ctx, args.itemId);
    const { root, children } = await family(ctx, item);
    const target = item.parentId ? item : root;
    const members = item.parentId ? [item] : [root, ...children];
    if (members.some((member) => !member.archived)) {
      throw new Error(
        item.parentId
          ? "Archive this Item before deleting it."
          : "Archive this Item family before deleting it.",
      );
    }
    if (args.confirmation.trim() !== target.title) {
      throw new Error("Type the Item title exactly to confirm deletion.");
    }
    for (const member of members) {
      const links = await ctx.db
        .query("itemTags")
        .withIndex("by_itemId", (q) => q.eq("itemId", member._id))
        .take(100);
      for (const link of links) await ctx.db.delete("itemTags", link._id);
      await ctx.db.delete("items", member._id);
    }
    return null;
  },
});
