# Life OS V1 scope — revision 2

This is the authoritative V1 scope. It combines the product philosophy in
[`VISION.md`](./VISION.md), the useful requirements preserved in
[`V1_SCOPE.md`](./V1_SCOPE.md), and the decisions made for the new `draft3`
implementation. The original scope remains unchanged as a historical record.

The `draft2` application is a behavioral and UX reference only. Its centralized
state management, local-storage architecture, oversized components, and styling
must not be ported into `draft3`.

## Product promise

Life OS is a personal balance system, not a conventional todo app. It helps a
person capture thoughts immediately, organize the important parts of life, and
notice what is being unintentionally neglected.

The V1 test is:

> Can a person stop using a self-chat for personal capture and reliably find,
> organize, act on, and preserve that information in Life OS?

## Launch shape

- Public product for real users.
- Client-rendered Solid 2 SPA.
- Convex provides cloud persistence, realtime updates, and authorization.
- Netlify hosts the production frontend.
- Desktop web and mobile web receive equal UX attention.
- Installable/offline PWA behavior is deferred until after the core V1 launch.
- Authentication is optional at first interaction, but every session has a
  cloud-backed anonymous identity.

## Identity and account lifecycle

Every visitor entering `/app` receives a Better Auth anonymous account if no
session exists. A Life OS profile and default Workspace are created
idempotently for that identity. Anonymous use is cloud-backed; Life OS does not
maintain a second local-storage database.

The frontend uses Better Auth's framework-agnostic vanilla JavaScript client.
It does not use Better Auth's Solid integration because that integration is not
assumed to support this project's Solid 2 beta runtime. Life OS owns a small
internal adapter that exposes session and token state through locally verified
Solid 2 primitives.

After meaningful use, the product gently asks the person to make the account
permanent. Signup requires:

- globally unique lowercase username;
- email address;
- password.

Users can sign in with username or email. V1 exposes only `username`; it does
not ask for a separate display name. If Better Auth internally requires a name,
the username may be mirrored into that field without creating a separate Life
OS concept.

Usernames are case-insensitive, validated, and changeable. Username changes
have a server-enforced cooldown. Exact cooldown duration and prompt thresholds
may be tuned without changing the domain model.

Upgrading the current anonymous identity preserves its profile, Workspaces,
Areas, Items, and Tags. If a person signs into an existing permanent account
while anonymous data exists, the UI explicitly offers to import the anonymous
Workspace or discard it; data is never silently merged or destroyed.

Profiles have a `user` or `admin` role. The first administrator is bootstrapped
manually once through the Convex dashboard after creating an account; no
first-admin environment variable is required.

## Workspaces

A user owns multiple Workspaces. Collaboration, invitations, shared ownership,
and membership roles are outside V1. Each Workspace therefore has one direct
owner rather than a membership table.

Every new anonymous or permanent profile always receives a default Workspace,
so application queries never depend on an absent Workspace. The user can rename
it and create, switch, archive, restore, or permanently delete other Workspaces
according to guarded lifecycle rules.

The active Workspace is selected through a compact switcher attached to the
avatar at the bottom of the existing sidebar.

## Areas

Areas represent important parts of life. Users can create as many as needed
within a Workspace.

An Area stores its name, description, icon, and color. Icon and color are domain
data because they are user choices that identify the Area and must synchronize
across devices.

Areas support create, read, update, archive, restore, and permanent deletion.
Archiving an Area does not rewrite each Item's individual archive state. Active
queries hide every Item belonging to an archived Area. Restoring the Area
therefore restores its exact previous combination of active and archived Items.

Permanent deletion is available only from Archive. Deleting an Area permanently
deletes its Items and Item-tag relationships. The confirmation displays the
affected count and requires typing the Area name.

## Items

Everything captured or stored is an Item. V1 has five fixed types:

| Type | Purpose |
|---|---|
| Task | Something to do |
| Note | Something to remember |
| Event | Something happening at a time |
| Expense | Money going out |
| Payment | Money coming in |

A newly captured Inbox Item may have no type. Before an Item leaves Inbox for an
Area, it must have a type.

Tasks may have `Todo`, `In Progress`, or `Done` status. Only Expenses and
Payments have amount and settlement fields. Items may also have a due date,
priority, description, tags, and a single-level parent.

Item color and favorites are not V1 concepts and must be removed from the
current schema.

## Inbox

Inbox is a slide-out panel available on every `/app` page. It is not a separate
primary page or sidebar destination.

Quick capture requires only a title and creates an Item with `areaId: null` and
no required type. Existing typed Items can be moved back to Inbox without
losing their type or other metadata.

The panel supports opening and organizing Items without losing the current page
context. Assigning a valid Area requires a type and removes the Item from Inbox
reactively.

## Parent and child rules

Items support one child level only:

- parent and child may have different Item types;
- an attached child always shares its parent's Workspace and location;
- moving a parent between Areas moves all children;
- moving a parent to Inbox moves all children to Inbox;
- moving one child independently to Inbox detaches it by clearing `parentId`;
- moving a parent to another Area preserves child metadata;
- a child cannot itself be a parent;
- archive, restore, and permanent deletion operate consistently over the
  parent family.

## Tags

Tags are normalized Workspace entities, not embedded Item string arrays.

```text
tags
├── workspaceId
├── name
├── normalizedName
└── createdAt

itemTags
├── workspaceId
├── itemId
├── tagId
└── createdAt
```

Names are unique case-insensitively within a Workspace. This model supports
renaming, counts, browsing, and indexed lookup. Default tags may be created
idempotently with the default Workspace.

## Application routes and surfaces

The public landing page remains `/`. The authenticated-or-anonymous product
lives below `/app`.

- `/app/areas`
- `/app/areas/$areaId`
- `/app/areas/$areaId/calendar`
- `/app/today`
- `/app/upcoming`
- `/app/tags`
- `/app/archive`
- `/app/settings`
- a global Search surface reachable without expanding the optimized sidebar

The existing `draft3` sidebar, navigation order, and visual direction are
preserved. Any structural or visual change requires comparison with `draft2`
and explicit product discussion first.

## Route-aware Item inspector

Every Item view uses one context-preserving inspector.

```text
/app/areas/$areaId?item=$itemId
/app/areas/$areaId?item=$itemId&mode=edit
/app/today?item=$itemId
```

On desktop and tablet it is a right-side inspector over the current context. On
mobile it becomes a full-screen sheet. Closing or using browser Back restores
the underlying page. The same inspector handles view, create, edit, archived,
and child creation states.

## Required views

- **Areas:** active Areas and Area detail.
- **Area calendar:** dated Items in one Area.
- **Today:** incomplete Tasks due today with completion controls.
- **Upcoming:** future dated Items ordered and grouped clearly.
- **Search:** global search across title, description, type, tags, and Area.
- **Tags:** Workspace tags and Items associated with a selected tag.
- **Archive:** archived Items and Areas, restore, and guarded permanent delete.
- **Settings:** Workspace/account essentials without custom workflow systems.

## Optimistic and realtime behavior

All user-facing CRUD is designed optimistically from the start. Solid 2
`createOptimisticStore`, `createOptimistic`, `action`, `affects`, and `refresh`
are used according to the local Solid 2 reference implementation.

Convex subscriptions remain authoritative. A feature must not apply both a
Solid optimistic overlay and a Convex client optimistic overlay to the same
mutation. Failures revert cleanly and surface actionable inline feedback.

## Archive and deletion

Archive is the normal removal action. Permanent deletion exists only in Archive:

- an individual Item uses a clear irreversible-action confirmation;
- a parent deletion includes its children;
- Area or Workspace deletion shows affected counts and requires typing its name;
- server mutations re-check ownership, archived state, and dependencies;
- deletion is transactional where bounded and safely batched when required.

## Administration

An admin surface is planned as the last milestone before launch if core product
quality permits. Server authorization is mandatory before any admin UI.

Recommended initial capabilities:

- operational overview and aggregate counts;
- inspect profile/account state without casually exposing private Item content;
- manage user suspension;
- promote or demote administrators;
- seed/reset only explicitly selected development or demo Workspaces;
- audit destructive administrative actions.

Admin scope may be reduced for launch, but ordinary users must never gain access
to seed, reset, or administrative functions.

## Explicit non-goals

- collaboration and Workspace invitations;
- multiple owners or Workspace membership roles;
- AI assistant;
- recurring-task automation;
- dependency graphs;
- grandchildren or unlimited nesting;
- custom databases and custom workflows;
- Kanban systems;
- time tracking;
- inventory, CRM, or finance reporting;
- external calendar synchronization;
- offline-first data mutation;
- SSR;
- automated test infrastructure for the initial MVP;
- CI or GitHub Actions for the initial MVP.

## Definition of V1 success

A first-time visitor can enter immediately, receive a safe anonymous identity
and default Workspace, capture an Item, organize it into an Area, enrich and
complete it, retrieve it through the relevant views, archive and restore it,
switch Workspaces, and later create a permanent account without losing data.
The same data is available from another device after permanent sign-in.
