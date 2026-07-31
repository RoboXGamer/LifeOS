# Life OS V1 scope

This document defines **what ships in V1**. It consolidates the detailed product
requirements from the earlier `draft2` prototype; that prototype is a product
and interaction reference only, not an implementation template. The current
codebase should continue to favor a minimal, bounded approach and implement
these capabilities cleanly on its Solid 2 and Convex foundation.

Read [`VISION.md`](./VISION.md) first for the product philosophy behind this
scope.

## Product goal

Life OS is a personal operating system, not a conventional todo app. Its goal is
to centralize fragmented information from college, freelancing, projects,
business, health, and personal life so that important areas do not quietly
disappear from attention.

The central question for V1 is:

> Can the user completely stop using a WhatsApp self-chat for personal capture
> within 30 days?

## Core hierarchy

```text
Workspace
└── Area
    └── Item
        └── Child Item
```

V1 has one workspace. Areas represent the major parts of a person's life, such
as College, Freelancing, Projects, Business, Personal, Health, or Content
Creation. Users may create as many Areas as they need.

Everything stored inside an Area or the Inbox is an Item. An Item may have child
Items, but nesting is limited to one child level—there are no grandchildren.
Children may have a different Item type from their parent.

## Item types

Every Item has one of five fixed types:

| Type | Question it answers |
|---|---|
| Task | What do I need to do? |
| Note | What do I need to remember? |
| Event | When is something happening? |
| Expense | What money went out? |
| Payment | What money came in? |

Tasks may have a status of `Todo`, `In Progress`, or `Done`. Notes and Events do
not have task status. Expenses and Payments use a settled/pending value instead.

## Item data

The V1 Item model contains:

```text
id
workspaceId
title
type
areaId
status
priority
dueDate
amount
isSettled
archived
description
parentId
tags
favorite
color
createdAt
updatedAt
```

Only the title is required during quick capture. Type-specific fields should be
validated: status belongs only to Tasks, while amount and settlement belong
only to Expenses and Payments.

Priority is numeric: `1` is highest, followed by `2` and `3`; no value means the
Item is not prioritized.

## Inbox and capture-first workflow

Inbox is the most important V1 feature. An Inbox Item is simply an Item whose
`areaId` is null.

Capture must be immediate:

```text
Thought → Open Life OS → Type a title → Save → Item appears in Inbox
```

The user can organize it later by assigning an Area and type, then optionally
adding a due date, priority, tags, description, money fields, or a parent. Once
an Area is assigned, the Item leaves Inbox. This “capture first, organize later”
workflow must remain faster than putting the thought into a self-chat.

## Tags

Tags are flexible labels that cut across Areas and Item types. Users can create
additional tags. V1 starts with:

- `#urgent`
- `#waiting`
- `#recurring`
- `#idea`
- `#reference`
- `#client`
- `#order`

The `#recurring` tag is only a label in V1; recurring-task automation is not a
V1 feature.

## V1 views and workflows

### Inbox

Shows unprocessed Items. The user can quick-capture an Item, open it, add
context, and assign an Area.

### Today

Shows incomplete Tasks due today. The user can mark a Task done; completed Tasks
should no longer clutter the active Today list.

### Upcoming

Shows future deadlines and Events ordered by date.

### Areas

Shows all active Areas. Opening an Area shows its active Items, including
single-level child Items. Users can create and edit Areas and view dated Area
Items in a calendar-oriented view.

### Search

Searches globally across Item titles, descriptions, tags, types, and Areas.

### Tags

Shows available tags and lets the user browse Items associated with a selected
tag.

### Archive

Archived Areas and Items leave active views but remain recoverable. Archive is
the normal removal action; permanent deletion, if exposed at all, must be a
deliberate action restricted to already archived data.

### Settings

Supports basic single-workspace management and other small V1-level controls.
It must not grow into a custom-workflow or administration system.

## Required behavior and integrity

- Assigning a parent Item to another Area also keeps its children in that Area.
- A child can only belong to a top-level parent in the same Workspace and Area.
- Archiving an Area archives or hides its Items consistently.
- Archiving a parent handles its children consistently.
- Restoring data must not create active Items inside archived parents or Areas.
- Active Items must never reference missing Areas or invalid parents.
- Completed and archived content must not clutter active views.
- V1 data is cloud-first and designed for authentication and cross-device sync,
  even if those capabilities are introduced incrementally during development.
- The intended delivery platform is a responsive PWA for web, desktop, and
  mobile use.

## Explicitly outside V1

Keep V1 intentionally bounded. Do not add these without an explicit scope
change:

- multiple workspaces
- team collaboration or chat
- an AI assistant
- recurring-task automation
- dependency graphs
- complex automation
- grandchildren or unlimited nesting
- custom databases
- custom or Kanban workflows
- time tracking
- inventory management
- finance reports or dashboard analytics
- cross-Item relations outside the parent/child model
- external calendar synchronization
- templates that generate Item trees
- specialized business modules such as CRM or content-calendar systems

These are possible future directions, not latent requirements that should shape
V1 into a larger system prematurely.

## Implementation principle

Recreate the product behavior, not the `draft2` architecture. Each capability
should be added in the smallest coherent slice that fits the current Solid 2
and Convex design. Avoid porting its centralized `App.tsx` state machine,
browser-storage data layer, oversized components, or styling wholesale.
