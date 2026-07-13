import { DEFAULT_TAGS, areaSchema, itemSchema } from "../schemas";
import type { Area, Item, Workspace } from "../types";

const timestamp = "2026-07-13T08:00:00.000Z";
export const DEFAULT_WORKSPACE_ID = "workspace-kizi";
export const initialWorkspace: Workspace = { id: DEFAULT_WORKSPACE_ID, name: "Kizi OS", createdAt: timestamp, updatedAt: timestamp };
export const initialTags = [...DEFAULT_TAGS];

const seedItems = [
  { id: "item-dbms", title: "Submit DBMS assignment", areaId: null, color: "violet", type: "Task", status: "Todo", priority: 1, dueDate: "2026-07-13", tags: ["urgent"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-paper", title: "Buy wrapping paper", areaId: null, color: "green", type: "Task", status: "Todo", dueDate: "2026-07-14", tags: ["order"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-reel", title: "Idea for reel", areaId: null, color: "amber", type: "Note", tags: ["idea"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-homepage", title: "Client homepage changes", areaId: null, color: "blue", type: "Task", status: "In Progress", priority: 1, dueDate: "2026-07-13", tags: ["client"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-read", title: "Read Atomic Habits", areaId: null, color: "orange", type: "Note", tags: ["reference"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-gym", title: "Gym workout", areaId: null, color: "indigo", type: "Task", status: "Todo", dueDate: "2026-07-13", tags: ["health"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-trip", title: "Book weekend trip", areaId: null, color: "teal", type: "Event", dueDate: "2026-07-18", tags: ["personal"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },
  { id: "item-insurance", title: "Renew car insurance", areaId: null, color: "coral", type: "Task", status: "Todo", priority: 2, dueDate: "2026-07-16", tags: ["personal"], parentId: null, archived: false, createdAt: timestamp, updatedAt: timestamp },

  { id: "college-dbms", title: "Submit DBMS assignment", areaId: "area-college", color: "violet", type: "Task", status: "In Progress", priority: 1, dueDate: "2024-05-12", description: "Complete all the questions from the DBMS assignment PDF and submit before the deadline. Focus on normalization and SQL queries.", tags: ["urgent"], parentId: null, archived: false, createdAt: "2024-05-08T10:32:00.000Z", updatedAt: "2024-05-11T09:15:00.000Z" },
  { id: "college-notes", title: "OS lecture notes", areaId: "area-college", color: "amber", type: "Note", description: "Consolidate process scheduling and memory-management notes.", tags: ["reference"], parentId: null, archived: false, createdAt: "2024-05-07T12:00:00.000Z", updatedAt: "2024-05-07T12:00:00.000Z" },
  { id: "college-exam", title: "Mid-sem exam", areaId: "area-college", color: "green", type: "Event", dueDate: "2024-05-20", tags: ["exam"], parentId: null, archived: false, createdAt: "2024-05-06T08:00:00.000Z", updatedAt: "2024-05-06T08:00:00.000Z" },
  { id: "college-print", title: "Print lab file", areaId: "area-college", color: "violet", type: "Task", status: "Todo", priority: 2, dueDate: "2024-05-14", tags: ["lab"], parentId: null, archived: false, createdAt: "2024-05-06T08:00:00.000Z", updatedAt: "2024-05-06T08:00:00.000Z" },
  { id: "college-fees", title: "Semester fees", areaId: "area-college", color: "orange", type: "Expense", amount: 18000, isSettled: false, dueDate: "2024-05-10", tags: ["fees"], parentId: null, archived: false, createdAt: "2024-05-05T08:00:00.000Z", updatedAt: "2024-05-05T08:00:00.000Z" },
  { id: "college-refund", title: "Scholarship refund", areaId: "area-college", color: "teal", type: "Payment", amount: 4000, isSettled: true, dueDate: "2024-05-08", tags: ["scholarship"], parentId: null, archived: false, createdAt: "2024-05-04T08:00:00.000Z", updatedAt: "2024-05-08T08:00:00.000Z" },
  { id: "college-project", title: "Mini project presentation", areaId: "area-college", color: "violet", type: "Task", status: "Done", priority: 2, dueDate: "2024-05-18", tags: ["project"], parentId: null, archived: false, createdAt: "2024-05-03T08:00:00.000Z", updatedAt: "2024-05-18T08:00:00.000Z" },
  { id: "college-project-slides", title: "Prepare slides", areaId: "area-college", color: "violet", type: "Task", status: "Done", priority: 2, dueDate: "2024-05-10", tags: ["design"], parentId: "college-project", archived: false, createdAt: "2024-05-03T08:00:00.000Z", updatedAt: "2024-05-10T08:00:00.000Z" },
  { id: "college-project-demo", title: "Practice demo", areaId: "area-college", color: "blue", type: "Task", status: "Done", priority: 3, dueDate: "2024-05-16", tags: ["practice"], parentId: "college-project", archived: false, createdAt: "2024-05-03T08:00:00.000Z", updatedAt: "2024-05-16T08:00:00.000Z" },
  { id: "college-project-tips", title: "Presentation tips", areaId: "area-college", color: "amber", type: "Note", tags: ["reference"], parentId: "college-project", archived: false, createdAt: "2024-05-03T08:00:00.000Z", updatedAt: "2024-05-03T08:00:00.000Z" },
  { id: "college-react", title: "React tutorial link", areaId: "area-college", color: "amber", type: "Note", tags: ["reference"], parentId: null, archived: false, createdAt: "2024-05-02T08:00:00.000Z", updatedAt: "2024-05-02T08:00:00.000Z" }
];

export const initialItems: Item[] = seedItems.map(item => itemSchema.parse({ workspaceId: DEFAULT_WORKSPACE_ID, favorite: false, ...item }));

const seedAreas = [
  { id: "area-college", name: "College", icon: "graduation", tone: "violet", description: "Assignments, notes, events, and expenses for your college life.", createdAt: timestamp, updatedAt: timestamp },
  { id: "area-freelancing", name: "Freelancing", icon: "briefcase", artIcon: "monitor", tone: "blue", description: "Clients, deliverables, payments, and your independent work.", createdAt: timestamp, updatedAt: timestamp },
  { id: "area-projects", name: "Projects", icon: "folder", artIcon: "mountain", tone: "green", description: "Ideas and projects you are actively bringing to life.", createdAt: timestamp, updatedAt: timestamp },
  { id: "area-business", name: "Business", icon: "chart", tone: "amber", description: "Operations, orders, planning, and business finances.", createdAt: timestamp, updatedAt: timestamp },
  { id: "area-personal", name: "Personal", icon: "user", tone: "coral", description: "Plans, notes, and moments that belong to your personal life.", createdAt: timestamp, updatedAt: timestamp },
  { id: "area-health", name: "Health", icon: "heartPulse", tone: "teal", description: "Habits, appointments, fitness, and your wellbeing.", createdAt: timestamp, updatedAt: timestamp }
];

export const initialAreas: Area[] = seedAreas.map(area => areaSchema.parse({ workspaceId: DEFAULT_WORKSPACE_ID, archived: false, ...area }));
