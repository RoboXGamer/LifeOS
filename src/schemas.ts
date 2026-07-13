import { z } from "zod";

export const DEFAULT_TAGS = ["urgent", "waiting", "recurring", "idea", "reference", "client", "order"] as const;
export const ITEM_TYPES = ["Task", "Note", "Event", "Expense", "Payment"] as const;
export const ITEM_STATUSES = ["Todo", "In Progress", "Done"] as const;
export const ITEM_PANEL_MODES = ["view", "edit", "create", "archived"] as const;
export const ITEM_COLORS = ["violet", "green", "amber", "blue", "orange", "indigo", "teal", "coral"] as const;
export const AREA_TONES = ["violet", "blue", "green", "amber", "coral", "teal"] as const;
export const ICON_NAMES = [
  "inbox", "grid", "calendar", "tag", "chart", "settings", "edit", "graduation", "cart", "bulb", "monitor", "book", "dumbbell", "plane",
  "checkSquare", "briefcase", "folder", "user", "heart", "heartPulse", "leaf", "mountain", "more", "list", "plus", "command", "sparkle", "close",
  "search", "filter", "share", "users", "star", "flag", "clock", "chevronDown", "chevronRight", "archive", "trash", "currency", "expense", "payment", "description"
] as const;

const idSchema = z.string().trim().min(1).max(120);
const timestampSchema = z.iso.datetime();
const optionalText = z.string().trim().max(5000).optional();
const tagSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-_]*$/).max(40);

export const workspaceSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(1).max(80),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

export const areaSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  name: z.string().trim().min(1).max(80),
  icon: z.enum(ICON_NAMES),
  artIcon: z.enum(ICON_NAMES).optional(),
  tone: z.enum(AREA_TONES),
  description: optionalText,
  archived: z.boolean().default(false),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
});

export const itemSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  title: z.string().trim().min(1).max(240),
  areaId: idSchema.nullable(),
  color: z.enum(ITEM_COLORS),
  type: z.enum(ITEM_TYPES),
  status: z.enum(ITEM_STATUSES).optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  dueDate: z.iso.date().optional(),
  amount: z.number().finite().nonnegative().optional(),
  isSettled: z.boolean().optional(),
  description: optionalText,
  tags: z.array(tagSchema).max(30).default([]),
  parentId: idSchema.nullable().default(null),
  archived: z.boolean().default(false),
  favorite: z.boolean().default(false),
  createdAt: timestampSchema,
  updatedAt: timestampSchema
}).superRefine((item, context) => {
  if (item.type === "Task" && !item.status) context.addIssue({ code: "custom", path: ["status"], message: "Tasks require a status." });
  if (item.type !== "Task" && item.status) context.addIssue({ code: "custom", path: ["status"], message: "Only Tasks can have a status." });
  const finance = item.type === "Expense" || item.type === "Payment";
  if (!finance && (item.amount !== undefined || item.isSettled !== undefined)) context.addIssue({ code: "custom", path: ["amount"], message: "Only Expenses and Payments can have finance fields." });
});

export const itemFormSchema = z.object({
  title: z.string().trim().min(1).max(240),
  type: z.enum(ITEM_TYPES),
  areaId: idSchema.nullable(),
  status: z.enum(ITEM_STATUSES).optional(),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  dueDate: z.iso.date().optional(),
  amount: z.number().finite().nonnegative().optional(),
  isSettled: z.boolean().optional(),
  description: optionalText,
  tags: z.array(tagSchema).max(30),
  parentId: idSchema.nullable().optional()
});

export const appRouteSearchSchema = z.object({
  item: z.string().optional(),
  panel: z.enum(ITEM_PANEL_MODES).optional(),
  area: z.string().optional(),
  parent: z.string().optional(),
  date: z.iso.date().optional()
});

export const waitlistEntrySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  createdAt: timestampSchema
});

export const waitlistSchema = z.array(waitlistEntrySchema).max(10000);

export const appStateSchema = z.object({
  version: z.literal(2),
  workspace: workspaceSchema,
  areas: z.array(areaSchema),
  items: z.array(itemSchema),
  tags: z.array(tagSchema)
}).superRefine((state, context) => {
  if (state.areas.some(area => area.workspaceId !== state.workspace.id)) context.addIssue({ code: "custom", path: ["areas"], message: "Every Area must belong to the active Workspace." });
  if (new Set(state.areas.map(area => area.id)).size !== state.areas.length) context.addIssue({ code: "custom", path: ["areas"], message: "Area IDs must be unique." });
  if (new Set(state.items.map(item => item.id)).size !== state.items.length) context.addIssue({ code: "custom", path: ["items"], message: "Item IDs must be unique." });
  if (new Set(state.tags).size !== state.tags.length) context.addIssue({ code: "custom", path: ["tags"], message: "Tags must be unique." });
  const areaMap = new Map(state.areas.filter(area => area.workspaceId === state.workspace.id).map(area => [area.id, area]));
  const areaIds = new Set(areaMap.keys());
  const itemMap = new Map(state.items.map(item => [item.id, item]));
  for (const [index, item] of state.items.entries()) {
    if (item.workspaceId !== state.workspace.id) context.addIssue({ code: "custom", path: ["items", index, "workspaceId"], message: "Item belongs to another Workspace." });
    if (item.areaId && !areaIds.has(item.areaId)) context.addIssue({ code: "custom", path: ["items", index, "areaId"], message: "Area does not exist." });
    if (item.areaId && areaMap.get(item.areaId)?.archived && !item.archived) context.addIssue({ code: "custom", path: ["items", index, "archived"], message: "Items in an archived Area must also be archived." });
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (!parent || parent.parentId || parent.areaId !== item.areaId || parent.workspaceId !== item.workspaceId) {
        context.addIssue({ code: "custom", path: ["items", index, "parentId"], message: "Parent must be a top-level Item in the same Area." });
      }
      if (parent?.archived && !item.archived) context.addIssue({ code: "custom", path: ["items", index, "archived"], message: "Children of archived Items must also be archived." });
    }
  }
});

export type Workspace = z.infer<typeof workspaceSchema>;
export type Area = z.infer<typeof areaSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ItemFormValue = z.infer<typeof itemFormSchema>;
export type AppState = z.infer<typeof appStateSchema>;
export type AppRouteSearch = z.infer<typeof appRouteSearchSchema>;
export type WaitlistEntry = z.infer<typeof waitlistEntrySchema>;
export type IconName = typeof ICON_NAMES[number];
export type ItemType = typeof ITEM_TYPES[number];
export type ItemStatus = typeof ITEM_STATUSES[number];
export type ItemColor = typeof ITEM_COLORS[number];
export type AreaTone = typeof AREA_TONES[number];
export type ItemPanelMode = typeof ITEM_PANEL_MODES[number];

export function normalizeItemFields<T extends Record<string, unknown>>(value: T) {
  const type = ITEM_TYPES.includes(value.type as typeof ITEM_TYPES[number]) ? value.type as typeof ITEM_TYPES[number] : "Task";
  return {
    ...value,
    type,
    status: type === "Task" ? (ITEM_STATUSES.includes(value.status as typeof ITEM_STATUSES[number]) ? value.status : "Todo") : undefined,
    amount: type === "Expense" || type === "Payment" ? value.amount : undefined,
    isSettled: type === "Expense" || type === "Payment" ? Boolean(value.isSettled) : undefined,
    tags: Array.isArray(value.tags) ? [...new Set(value.tags.map(String).map(tag => tag.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))] : []
  };
}

export function validateAppState(state: AppState): AppState {
  return appStateSchema.parse(state);
}

const legacyStateSchema = z.object({
  workspace: z.record(z.string(), z.unknown()).optional(),
  areas: z.array(z.record(z.string(), z.unknown())),
  items: z.array(z.record(z.string(), z.unknown())),
  tags: z.array(z.string()).optional()
});

export function migrateAppState(input: unknown, fallback: AppState): AppState {
  const current = appStateSchema.safeParse(input);
  if (current.success) return current.data;
  const legacy = legacyStateSchema.safeParse(input);
  if (!legacy.success) return fallback;

  const workspaceCandidate = workspaceSchema.safeParse(legacy.data.workspace);
  const workspace = workspaceCandidate.success ? workspaceCandidate.data : fallback.workspace;
  const areas = legacy.data.areas.flatMap((value) => {
    const parsed = areaSchema.safeParse({
      ...value,
      workspaceId: workspace.id,
      archived: value.archived === true,
      createdAt: typeof value.createdAt === "string" ? value.createdAt : workspace.createdAt,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : workspace.updatedAt
    });
    return parsed.success ? [parsed.data] : [];
  });
  const areaIds = new Set(areas.map(area => area.id));
  const archivedAreaIds = new Set(areas.filter(area => area.archived).map(area => area.id));
  const provisionalItems = legacy.data.items.flatMap((value) => {
    const normalized = normalizeItemFields({
      ...value,
      workspaceId: workspace.id,
      areaId: typeof value.areaId === "string" && areaIds.has(value.areaId) ? value.areaId : null,
      parentId: typeof value.parentId === "string" ? value.parentId : null,
      color: typeof value.color === "string" && ITEM_COLORS.includes(value.color as typeof ITEM_COLORS[number]) ? value.color : "violet",
      archived: value.archived === true || (typeof value.areaId === "string" && archivedAreaIds.has(value.areaId)),
      favorite: value.favorite === true,
      createdAt: typeof value.createdAt === "string" ? value.createdAt : workspace.createdAt,
      updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : workspace.updatedAt
    });
    const parsed = itemSchema.safeParse(normalized);
    return parsed.success ? [parsed.data] : [];
  });
  const itemMap = new Map(provisionalItems.map(item => [item.id, item]));
  const items = provisionalItems.map(item => {
    const parent = item.parentId ? itemMap.get(item.parentId) : undefined;
    const validParent = parent && !parent.parentId && parent.areaId === item.areaId;
    return itemSchema.parse({ ...item, parentId: validParent ? parent.id : null, archived: item.archived || Boolean(parent?.archived) });
  });
  const tags = [...new Set([...DEFAULT_TAGS, ...(legacy.data.tags ?? []), ...items.flatMap(item => item.tags)])];
  return appStateSchema.parse({ version: 2, workspace, areas, items, tags });
}
