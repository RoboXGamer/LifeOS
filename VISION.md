# LIFE OS V1 Vision

Not a Todo App.

A **Personal OS**.

Goal:

> Centralize all the fragmented information from college, freelancing, projects, business, and personal life into one system.

---

# Core Hierarchy

```text
Workspace
 └── Area
      └── Item
           └── Child Items
```

Example:

```text
Workspace: Kizi OS

Area: College
Area: Freelancing
Area: Projects
Area: Business
Area: Personal
```

---

# Area

Areas represent major parts of life.

Examples:

```text
College
Freelancing
Projects
Business
Personal
Health
Content Creation
```

Users can create unlimited Areas.

---

# Item

Everything is an Item.

A task is an Item.

A note is an Item.

An expense is an Item.

A payment is an Item.

Examples:

```text
Submit DBMS Assignment
```

```text
Pink Bouquet Order
```

```text
React Query Tutorial
```

```text
Client Payment ₹5000
```

---

# Item Types

5 fixed types. Every Item must be one of these.

| Type | Question it answers |
|---|---|
| Task | What do I need to do? |
| Note | What do I need to remember? |
| Event | When is something happening? |
| Expense | What money went out? |
| Payment | What money came in? |

---

# Child Items (Single-Level Nesting)

An Item may contain child Items.

Only one level deep.

Example:

```text
[Task] Pink Bouquet

 ├── [Task] Buy flowers
 ├── [Expense] Ribbon ₹250
 ├── [Task] Make bouquet
 └── [Task] Deliver bouquet
```

Example:

```text
[Task] Personal OS App

 ├── [Task] Design database
 ├── [Task] Build auth
 ├── [Task] Create inbox
 └── [Note] Future calendar module #idea
```

No grandchildren.

This is intentionally simple.

---

# Item Properties

Every Item is stored in one table with these columns:

```text
id
title
type              — Task / Note / Event / Expense / Payment
area_id           — which Area it belongs to
status            — nullable (Task only: Todo, In Progress, Done)
priority          — nullable integer (lower = more important)
due_date          — nullable
amount            — nullable (Expense / Payment only)
is_settled        — nullable boolean (Expense / Payment only)
is_archived       — boolean (default false)
description
parent_item_id    — nullable (for single-level nesting)
tags              — array of tag labels
created_at
updated_at
```

---

# Status

Status only applies to **Tasks**. Other types don't need it.

```text
Todo
In Progress
Done
```

Note and Event have no status. Expense and Payment use `is_settled` (boolean) to track paid/pending state.

---

# Archive

Not delete.

Archive.

Because after 6 months you'll have:

Completed semester tasks

Old client work

Finished projects

Past events

You won't want them deleted.

You also won't want them cluttering active views.

---

# Priority

Numeric. Lower number = higher priority. NULL = no priority set.

```text
1  → Do first
2  → Do second
3  → Do third
NULL → Not prioritized
```

Applies to all Item types. Users reorder by changing the number (or dragging in UI).

---

# Tags

Flexible labels. Users can create unlimited tags. 7 default tags to start.

| Tag | Purpose |
|---|---|
| `#urgent` | Needs attention now |
| `#waiting` | Blocked, waiting on someone else |
| `#recurring` | Happens repeatedly (monthly bill, weekly task) |
| `#idea` | A note that's an idea for later |
| `#reference` | A note you'll come back to (tutorial, docs) |
| `#client` | Related to a client/freelance work |
| `#order` | Related to a delivery/fulfillment |

---

# Inbox (Most Important Feature)

Everything enters through Inbox.

Example:

```text
Need to submit DBMS assignment
```

```text
Buy wrapping paper
```

```text
Idea for reel
```

```text
Client asked for homepage changes
```

Later:

```text
Inbox
→ Assign Area
→ Assign Type
→ Set Due Date
→ Done
```

This replaces WhatsApp self-chat.

Note: Inbox = items where `area_id IS NULL`. Once Area is assigned, item leaves Inbox.

---

# Capture First, Organize Later

Every item can be created instantly. Only title is required. Everything else is optional and can be added later.

Example:

```text
Need to buy flowers
```

Save. Done.

Later:

```text
Area = Business
Type = Task
Priority = 1
Due Date = Tomorrow
```

This is what makes Inbox work.

---

# Views

### Inbox

Unprocessed items.

### Today

Tasks due today.

### Upcoming

Future deadlines.

### Area View

See everything inside:

```text
College
```

or

```text
Business
```

### Search

Global search.

---

# Things Explicitly NOT in V1

To avoid feature creep:

❌ Multiple workspaces

❌ Team collaboration

❌ Chat

❌ AI assistant

❌ Recurring tasks

❌ Dependency graph

❌ Complex automations

❌ Multiple nesting levels

❌ Custom databases

❌ Kanban workflows

❌ Time tracking

❌ Inventory management

❌ Finance reports

---

# V2 Parking Lot (Ideas Left on the Table)

These are intentionally postponed.

### Item Dependencies

```text
Task B depends on Task A
```

Example:

```text
Package Bouquet
depends on
Make Bouquet
```

Useful for larger workflows.

---

### Custom Statuses per Item Type

Example:

```text
Order

Pending
Making
Packed
Delivered
```

instead of generic Todo/In Progress/Done.

---

### Unlimited Nesting

```text
Project
 └── Feature
       └── Task
```

Rejected for V1.

---

### Cross-Item Relations

Example:

```text
Expense
related to
Order #42
```

without being a child.

---

### Calendar Integration

Google Calendar sync.

---

### Recurring Tasks

Example:

```text
Pay hosting every month
```

---

### Templates

Example:

Create Order automatically generates:

```text
Buy flowers
Make bouquet
Package
Deliver
```

---

### Dashboard Analytics

Examples:

```text
Tasks completed this week
Orders delivered
Expenses this month
```

---

### Business Modules

For your friend later:

```text
Inventory
Finance
Content Calendar
Customer CRM
```

---

If I were building this, I'd focus first on only one question:

> "Can I completely stop using WhatsApp self-chat within 30 days?"

If the answer becomes yes, then V1 has already solved a real problem. The rest can evolve from actual usage rather than guesses.

---

# Technical Decisions

- Platform: PWA (web + desktop + mobile)
- Backend: Cloud-first (auth + sync from day one)
