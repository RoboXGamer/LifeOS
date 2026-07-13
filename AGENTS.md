# Project Context

## What this project is

This is an early Solid 2 beta prototype for **Life OS V1**, a personal operating system rather than a conventional todo app. Read `VISION.md` before making product decisions.

The intended product centralizes college, freelance, project, business, and personal information. Its core hierarchy is:

```text
Workspace -> Area -> Item -> Child Item
```

Everything is an Item with one of five fixed types: Task, Note, Event, Expense, or Payment. The central workflow is **capture first, organize later**: create an Inbox item with only a title, then later assign its Area, type, dates, priority, tags, and other metadata. An Inbox item is an item whose `area_id` is null.

V1 is deliberately small. Avoid adding collaboration, AI, recurring tasks, deep nesting, custom workflows, analytics, or other features listed outside V1 in `VISION.md` unless explicitly requested.

## Current implementation

This codebase is currently a learning/proof-of-concept, not the complete Life OS V1.

- `src/App.tsx` contains nearly all application logic.
- Users can create/delete Inbox items and Areas.
- Users can drag an Inbox item onto an Area, which sets its `areaId` and removes it from the Inbox view.
- State is in memory only; refreshing loses all data.
- Assigned items currently have no Area detail view, so they disappear from the visible UI.
- Item types, metadata, child items, archive, search, Today, Upcoming, persistence, auth, sync, and PWA support are not implemented.
- Current deletion conflicts with the vision's "archive, not delete" rule.
- Deleting an Area can leave items referencing an Area that no longer exists.

The project uses Vite, TypeScript, `solid-js` 2 beta, `@solidjs/web` 2 beta, and `nanoid`.

## Solid 2 beta: important

Do not review or rewrite this code using Solid 1 assumptions. The local Solid 2 source, beta documentation, tests, and examples are the source of truth:

```text
C:\Users\A5IN\Coding\SolidJS-Learning\reference\solid2
```

Start with:

```text
documentation/solid-2.0/MIGRATION.md
documentation/solid-2.0/README.md
packages/solid/CHEATSHEET.md
examples/
```

Solid 2 patterns already used here include:

- `createSignal(() => expression)` as a derived signal. The `inboxItems` declaration in `App.tsx` is intentional.
- Split `createEffect(compute, effect)`, where the first function declares dependencies and the second performs side effects.
- A unified `<For>` API with keying modes. With a custom key such as `keyed={(item) => item.id}`, row values passed to the callback are accessors.
- Newer primitives and semantics including `Loading`, `Errored`, async computations, revised stores, automatic batching, and updated ownership/DOM behavior.

When uncertain about an API, inspect the local Solid 2 documentation and implementation before changing it. Passing a Solid 1-style intuition check is not sufficient.

## Working guidance

- Preserve the capture-first Inbox workflow; it is the product's most important feature.
- Keep V1 intentionally simple, including only single-level child items.
- Prefer archive behavior over permanent deletion for Items.
- Treat `VISION.md` as product intent and the Solid 2 reference repository as framework intent.
- Keep changes compatible with the beta versions pinned in `package.json`.
- Run the TypeScript check after code changes. A working local form is:

```powershell
.\node_modules\.bin\tsc.cmd -p tsconfig.app.json --noEmit --incremental false --pretty false
```

