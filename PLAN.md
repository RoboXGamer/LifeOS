# Life OS V1 implementation plan

This is the living execution tracker for
[`V1_SCOPE_REV2.md`](./V1_SCOPE_REV2.md). Check tasks only after their acceptance
criteria are met. Add implementation notes and newly discovered dependencies
under the relevant task instead of silently changing scope.

## Status legend

- `[ ]` pending
- `[~]` in progress
- `[x]` complete and verified
- `[!]` blocked, with the blocker recorded immediately below

## Fixed decisions

- `draft3` is the implementation foundation.
- `draft2` is a product/interaction reference, not code to port.
- Preserve the current `draft3` shell, sidebar, navigation, and visual direction.
- Public landing page is `/`; product routes live below `/app`.
- Inbox is a global slide-out panel, not a primary route.
- Item details use a route-aware desktop inspector/mobile full-screen sheet.
- Solid 2 beta local source is authoritative.
- Convex is the realtime source of truth.
- Better Auth with Convex provides anonymous and permanent identities.
- The frontend uses Better Auth's framework-agnostic vanilla client behind a
  Life OS Solid 2 adapter; do not use Better Auth's Solid or React bindings.
- Permanent signup uses lowercase username, email, and password.
- Users may sign in with username or email.
- No separate display name in V1.
- Multiple owner-only Workspaces are supported; collaboration is deferred.
- Area icon/color stay; Item color/favorite are removed.
- Tags use `tags` and `itemTags` tables.
- Optimistic behavior is part of the initial architecture.
- Client-rendered SPA; SSR is deferred.
- No automated tests, linting, CI, or GitHub Actions for the initial MVP.
- Prettier is the only new code-quality tool.
- `pnpm run build` is run once at each milestone gate, not after every task.
- Netlify frontend and Convex Cloud deployments already exist.

## Reference sources

Read these before implementing the corresponding system:

- Solid 2 source and documentation:
  `C:\Users\A5IN\Coding\SolidJS-Learning\reference\solid2`
- Solid 2 optimistic example:
  `C:\Users\A5IN\Coding\SolidJS-Learning\experiments\solid2-optimistic-data`
- Better Auth + Convex and admin reference:
  `C:\Users\A5IN\Coding\Repos\Avikshit_work\frontend`
- Old Life OS behavior and UX reference:
  `C:\Users\A5IN\Coding\SolidJS-Learning\experiments\draft2`

For Solid changes, consult at minimum:

- `documentation/solid-2.0/MIGRATION.md`
- `documentation/solid-2.0/README.md`
- `documentation/solid-2.0/05-async-data.md`
- `documentation/solid-2.0/06-actions-optimistic.md`
- `packages/solid/CHEATSHEET.md`
- `examples/todos/`

For Convex work, read the installed/generated Convex AI guidelines first when
available. Do not infer current Convex or Better Auth APIs from older examples.

## Deployment safety

The local `draft3` `.env.local` points to the Convex development deployment.
The Netlify production frontend points to a separate production Convex
deployment. Git pushes trigger Netlify deployment.

- [ ] Never commit secrets or print environment values into logs/documentation.
- [ ] Confirm every schema/function change against the development deployment.
- [ ] Prefer additive, backward-compatible schema evolution before removing old
      fields.
- [ ] Do not run seed, reset, migration, or destructive functions against
      production during development.
- [ ] Treat the currently deployed `draft2`/main experience as live until the
      new V1 is intentionally promoted.
- [ ] Before promotion, confirm Netlify production variables include the
      production Convex URL/site URL and Better Auth trusted origins.
- [ ] Record any required one-time production dashboard action in the launch
      checklist before pushing.

---

# Milestone A — Foundation

Phases 1–3 form one milestone. It is complete only when a visitor can enter
`/app`, receive an anonymous profile/default Workspace, switch and manage
Workspaces, and perform complete Area CRUD with realtime and optimistic UI.

## Phase 1 — Application and routing foundation

### 1.1 Preserve and document the shell

- [ ] Inventory the existing `App.tsx`, `App.css`, sidebar controls, icons,
      responsive behavior, and Areas layout before editing.
- [ ] Record which `draft2` behaviors are useful, without copying its component
      architecture or CSS.
- [ ] Keep the current sidebar button order and visual treatment.
- [ ] Define responsive breakpoints and shell states for desktop, tablet, and
      mobile.
- [ ] Define the content contract for page headers, loading, empty, error, and
      not-found states.

Acceptance:

- Existing Areas presentation and sidebar identity remain recognizable.
- Shell supports a content page, global Inbox panel, Workspace menu, and future
  Item inspector without page-specific layout hacks.

### 1.2 Establish the route tree

- [ ] Move router construction out of `src/index.tsx` into a focused router
      module.
- [ ] Define `/` as the future landing route.
- [ ] Define `/app` redirect/default behavior.
- [ ] Define `/app/areas` and `/app/areas/$areaId`.
- [ ] Reserve `/app/areas/$areaId/calendar`, `/app/today`, `/app/upcoming`,
      `/app/tags`, `/app/archive`, and `/app/settings`.
- [ ] Define route search validation for `item`, `mode`, `parent`, and other
      inspector state.
- [ ] Add a not-found route and safe invalid-Workspace/Area behavior.
- [ ] Ensure direct navigation and Netlify SPA fallback work for every route.

Acceptance:

- Refreshing any declared route loads the SPA.
- Browser Back/Forward preserves page and validated inspector state.
- Placeholder routes do not require changes to the existing sidebar.

### 1.3 Organize code by responsibility

- [ ] Create focused locations for app shell, routes/pages, reusable UI,
      feature-domain code, auth, and internal Convex adapters.
- [ ] Keep Convex server functions grouped by domain.
- [ ] Introduce shared domain validators/constants instead of duplicated string
      unions.
- [ ] Avoid a centralized `App.tsx` state machine.

Proposed direction:

```text
src/
├── app/
├── auth/
├── components/
├── features/
│   ├── workspaces/
│   ├── areas/
│   ├── items/
│   ├── inbox/
│   └── tags/
├── pages/
└── convex/

convex/
├── auth.ts
├── auth.config.ts
├── http.ts
├── profiles.ts
├── workspaces.ts
├── areas.ts
├── items.ts
├── tags.ts
├── admin.ts
├── lib/
└── schema.ts
```

### 1.4 Minimal tooling

- [ ] Add Prettier as a development dependency.
- [ ] Add `format` and `format:check` scripts.
- [ ] Add `ready` script that runs formatting verification followed by the
      existing typecheck/build pipeline.
- [ ] Do not introduce ESLint, a test runner, CI, or GitHub Actions.

Expected scripts:

```json
{
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "ready": "pnpm run format:check && pnpm run build"
}
```

## Phase 2 — Identity, authorization, and database foundation

Phase 2 precedes user-owned CRUD. Workspace IDs supplied by the browser are
never sufficient authorization.

### 2.1 Integrate Better Auth with Convex

- [ ] Add compatible `better-auth` and `@convex-dev/better-auth` versions.
- [ ] Mount the Better Auth Convex component in `convex/convex.config.ts`.
- [ ] Add `convex/auth.config.ts`.
- [ ] Add `convex/auth.ts`, `convex/http.ts`, and trusted-origin normalization
      based on the Aravali reference.
- [ ] Enable email/password, username, and anonymous plugins.
- [ ] Use Better Auth's framework-agnostic vanilla JavaScript client; do not
      import its Solid or React client bindings.
- [ ] Build a small Life OS auth adapter that translates vanilla client session
      events and access-token fetching into locally verified Solid 2 state.
- [ ] Keep subscriptions/listeners owned and disposed according to Solid 2
      ownership semantics.
- [ ] Connect auth token loading from that adapter to the internal `src/convex`
      client/provider.
- [ ] Model auth readiness with Solid 2 async primitives and `<Loading>`.
- [ ] Treat the adapter as the only frontend module allowed to know Better
      Auth's client event/session shape.
- [ ] Prevent duplicate anonymous session creation during startup races.
- [ ] Keep the frontend usable while initial anonymous bootstrap is resolving.

Acceptance:

- A new browser session receives one anonymous Better Auth identity.
- Reload retains the same anonymous identity.
- Convex functions can resolve the authenticated identity.
- Auth failures produce a recoverable UI rather than an empty app.

### 2.2 Define the revised schema

- [ ] Add `profiles` with auth identity key, optional username/email for
      anonymous state, anonymous/permanent state, role, suspension state,
      username-change timestamp, created/updated timestamps.
- [ ] Add unique/indexed normalized username support.
- [ ] Add `workspaces.ownerId` and lifecycle timestamps.
- [ ] Keep Area `name`, `description`, `icon`, `color`, `archived`, and
      timestamps.
- [ ] Remove Item `color`, `favorite`, and embedded `tags`.
- [ ] Make Item `type` optional only for Inbox capture.
- [ ] Encode Item type/status/finance fields with literal unions and server
      validators.
- [ ] Add `tags` and `itemTags`.
- [ ] Retain waitlist data without coupling it to app profiles.
- [ ] Rename/add indexes so names describe all indexed fields.
- [ ] Add indexes for ownership, Workspace-scoped active views, parent lookup,
      dates, archive, normalized tags, and item-tag relationships.
- [ ] Decide whether the active Workspace is persisted on the profile or stored
      client-side with a safe server fallback; prefer profile persistence for
      cross-device continuity.

Target relationships:

```text
Better Auth user
└── profile
    └── workspaces (ownerId)
        ├── areas
        ├── items
        ├── tags
        └── itemTags
```

### 2.3 Centralize domain validation

- [ ] Define username normalization, reserved names, allowed characters,
      minimum/maximum lengths, and cooldown enforcement.
- [ ] Define Workspace and Area name/description limits.
- [ ] Define exact Item type, status, priority, amount, settlement, due-date,
      and description rules.
- [ ] Require an Item type when `areaId` is non-null.
- [ ] Validate single-level parent rules and shared location.
- [ ] Validate Tag normalization and Workspace uniqueness.
- [ ] Reject cross-Workspace IDs even when the documents exist.
- [ ] Use Convex argument and return validators for public functions.

### 2.4 Build authorization helpers

- [ ] Implement `requireProfile`.
- [ ] Implement `requireActiveProfile`.
- [ ] Implement `requireWorkspaceOwner`.
- [ ] Implement `requireAreaOwner`.
- [ ] Implement `requireItemOwner`.
- [ ] Implement `requireAdmin`.
- [ ] Derive identity on the server; never accept a user ID for authorization.
- [ ] Apply ownership checks to every query and mutation, including reads.
- [ ] Keep admin authorization server-side even if UI guards exist.

### 2.5 Bootstrap profile and default Workspace

- [ ] Create an idempotent bootstrap mutation for profile, default Workspace,
      and default Tags.
- [ ] Use a stable default name such as `My Life` for anonymous startup.
- [ ] Allow permanent signup/onboarding to rename the default Workspace.
- [ ] Persist a valid active Workspace.
- [ ] Repair only safe missing bootstrap records; never overwrite user data.

Acceptance:

- New and returning identities always resolve to a valid profile and Workspace.
- Repeated bootstrap calls do not create duplicates.
- One user cannot read or mutate another user's Workspace by guessing IDs.

## Phase 3 — Internal data layer and Workspace/Area vertical slice

### 3.1 Finish the internal Solid–Convex abstraction

- [ ] Review `client`, `connection`, `context`, `query`, `mutation`, and `action`
      as one lifecycle.
- [ ] Add auth-aware token refresh/reconnect behavior.
- [ ] Define consistent `skip`, initial value, loading, error, reconnect, and
      disposal behavior.
- [ ] Keep the abstraction internal to Life OS.
- [ ] Expose typed feature-facing primitives rather than raw client access.
- [ ] Ensure subscriptions do not leak when route arguments change.
- [ ] Define one error-normalization shape for user-facing mutations.

### 3.2 Establish the optimistic convention

- [ ] Create feature stores using Solid 2 `createOptimisticStore` over
      authoritative Convex query results.
- [ ] Wrap mutations in Solid 2 `action`.
- [ ] Apply the visible optimistic draft before yielding the Convex mutation.
- [ ] Reconcile with the live source/`refresh` after server completion.
- [ ] Use `affects` only for values known to change but not optimistically shown.
- [ ] Use a co-written optimistic process flag for “Saving…” affordances rather
      than misusing `isPending`.
- [ ] Surface mutation errors inline and allow retry where meaningful.
- [ ] Do not apply Convex `withOptimisticUpdate` to an entity already covered by
      a Solid optimistic store.
- [ ] Confirm concurrent create/update/archive actions resolve without stale
      overlays or flicker.

### 3.3 Workspace API and UI

- [ ] Query all active owner Workspaces with a bounded result.
- [ ] Query archived Workspaces for Archive/Settings.
- [ ] Create Workspace with normalized validation and default Tags.
- [ ] Rename Workspace.
- [ ] Switch active Workspace and update all scoped subscriptions.
- [ ] Archive and restore Workspace.
- [ ] Permanently delete an archived Workspace with typed confirmation and
      affected counts.
- [ ] Build the compact avatar-attached Workspace switcher.
- [ ] Include create, rename, archive, restore, account, and sign-in entry
      points without redesigning the sidebar.
- [ ] Handle zero/invalid active Workspace through bootstrap fallback.

### 3.4 Area API and UI

- [ ] Replace the fixed `WORKSPACE_ID` with active Workspace state.
- [ ] Query active Areas by Workspace through an index.
- [ ] Query archived Areas separately.
- [ ] Create Area with name, optional description, icon, and color.
- [ ] Edit Area fields.
- [ ] Archive Area without rewriting Item archive flags.
- [ ] Restore Area.
- [ ] Permanently delete an archived Area and its bounded relationships.
- [ ] Add create/edit UI consistent with the current Areas grid.
- [ ] Add mindful delete confirmation with affected Item count and typed Area
      name.
- [ ] Add empty, loading, error, retry, and optimistic states.
- [ ] Make controls keyboard-accessible and touch-friendly.

### 3.5 Foundation milestone verification

Manual verification:

- [ ] First visit creates one anonymous profile and default Workspace.
- [ ] Reload retains identity, active Workspace, and Areas.
- [ ] Workspace create/rename/switch/archive/restore works in realtime.
- [ ] Area create/edit/archive/restore/delete works optimistically.
- [ ] Failed mutations visibly roll back.
- [ ] Cross-Workspace IDs are rejected server-side.
- [ ] Desktop, tablet, and mobile layouts remain polished.
- [ ] Direct `/app/areas` refresh succeeds.
- [ ] Run `pnpm run build` once and resolve every error.

Milestone A is complete when all Phase 1–3 acceptance criteria pass.

---

# Milestone B — Core capture and organization

## Phase 4 — Item domain and route-aware inspector

### 4.1 Item server API

- [ ] Implement bounded/indexed active Item queries by Workspace and Area.
- [ ] Implement Item-by-ID query with ownership enforcement.
- [ ] Create untyped Inbox Item with title only.
- [ ] Create typed Item directly in an Area.
- [ ] Update shared and type-specific fields.
- [ ] Complete/reopen Tasks.
- [ ] Move Item between Areas.
- [ ] Move Item back to Inbox while preserving metadata.
- [ ] Create and edit single-level children.
- [ ] Move a parent family together.
- [ ] Detach a child moved independently to Inbox.
- [ ] Archive and restore Item families.
- [ ] Enforce archived-Area visibility in all active queries.

### 4.2 Item optimistic store

- [ ] Design stable keyed optimistic projections for list membership changes.
- [ ] Handle create/update/move/archive/complete actions immediately.
- [ ] Prevent duplicate optimistic records when Convex subscription catches up.
- [ ] Preserve field edits when an Item moves between live lists.
- [ ] Display targeted failure/retry state without losing typed form input.

### 4.3 Inspector routing and responsive shell

- [ ] Validate `item`, `mode`, and optional creation context in route search.
- [ ] Build desktop right-side inspector.
- [ ] Build mobile full-screen sheet using the same component/state.
- [ ] Support view, create, edit, archived, and child-create modes.
- [ ] Make browser Back close/restore inspector context.
- [ ] Handle missing, deleted, unauthorized, and moved Items safely.
- [ ] Add focus management, Escape behavior, focus return, and accessible labels.

### 4.4 Item form

- [ ] Title and optional type for Inbox capture/editing.
- [ ] Require type before Area assignment.
- [ ] Type-specific status/amount/settled fields.
- [ ] Area, due date, priority, description, tags, and parent.
- [ ] Preserve fields when changing type but clear invalid persisted fields on
      save with an understandable warning.
- [ ] Provide archive/restore controls.

## Phase 5 — Global Inbox and quick capture

- [ ] Build the global slide-out panel without adding a sidebar destination.
- [ ] Connect the existing Inbox sidebar button.
- [ ] Query active `areaId: null` Items in the active Workspace.
- [ ] Implement title-only quick capture with immediate optimistic insertion.
- [ ] Add keyboard-friendly capture and sensible focus return.
- [ ] Open an Inbox Item in the route-aware inspector over the current page.
- [ ] Organize Item by type and Area.
- [ ] Remove it from Inbox immediately after successful/optimistic assignment.
- [ ] Support moving organized Items back to Inbox.
- [ ] Add empty, reconnecting, failure, and retry states.
- [ ] Ensure mobile overlay, safe-area, touch targets, and scroll locking feel
      intentional.
- [ ] Add a gentle permanent-account prompt after meaningful anonymous usage;
      do not block capture.

### Milestone B verification

- [ ] Capture, organize, edit, complete, move, nest, archive, and restore Items.
- [ ] Verify parent-family movement rules.
- [ ] Verify all optimistic rollback paths manually.
- [ ] Verify browser navigation around the inspector.
- [ ] Verify desktop/tablet/mobile interaction.
- [ ] Run `pnpm run build` once and resolve every error.

---

# Milestone C — Daily retrieval and lifecycle

## Phase 6 — Area detail, Today, Upcoming, and calendar

### 6.1 Area detail

- [ ] Build `/app/areas/$areaId`.
- [ ] List top-level Items and one child level.
- [ ] Add type/status/priority/date affordances without visual clutter.
- [ ] Support direct Item creation in the Area.
- [ ] Reuse the inspector for every Item action.

### 6.2 Today

- [ ] Define client-local `YYYY-MM-DD` behavior explicitly.
- [ ] Pass current date into Convex queries; do not read wall clock in queries.
- [ ] Query incomplete Tasks due today with correct Workspace/Area/archive rules.
- [ ] Complete/reopen optimistically.
- [ ] Keep completed content discoverable without clutter.

### 6.3 Upcoming

- [ ] Query future dated Items with bounded pagination/order.
- [ ] Group or label dates clearly.
- [ ] Include relevant Tasks and Events without mixing semantics confusingly.
- [ ] Reuse the inspector and optimistic actions.

### 6.4 Area calendar

- [ ] Build `/app/areas/$areaId/calendar`.
- [ ] Show dated Items for the selected range.
- [ ] Navigate between list and calendar without losing selected Area.
- [ ] Create an Item prefilled with selected date through inspector routing.
- [ ] Keep the initial calendar bounded and accessible; avoid external calendar
      sync or scheduling complexity.

## Phase 7 — Tags and global Search

### 7.1 Tags

- [ ] Create/reuse normalized Workspace Tag during Item save.
- [ ] Maintain `itemTags` transactionally with Item changes.
- [ ] Rename Tag and preserve relationships.
- [ ] Delete unused Tag safely.
- [ ] Query Tags and counts without unbounded document arrays.
- [ ] Build `/app/tags` and tagged Item results.

### 7.2 Search

- [ ] Add appropriate Convex search index for Item title and filterable
      Workspace/archive fields.
- [ ] Decide the bounded search contract for description/type/tag/Area
      enrichment.
- [ ] Debounce input without making results feel delayed.
- [ ] Provide a global search trigger without changing sidebar navigation.
- [ ] Support keyboard access and mobile presentation.
- [ ] Open results in the shared inspector.

## Phase 8 — Archive and Settings

### 8.1 Archive

- [ ] Build archived Item and Area sections.
- [ ] Restore Items, families, Areas, and Workspaces safely.
- [ ] Permanently delete individual archived Item after explicit confirmation.
- [ ] Require typed name for parent-family, Area, or Workspace deletion.
- [ ] Show affected counts before destructive deletion.
- [ ] Ensure active data cannot be permanently deleted through these endpoints.

### 8.2 Settings

- [ ] Account summary and anonymous/permanent status.
- [ ] Username change form with validation and server cooldown.
- [ ] Email/session/sign-out controls supplied safely by Better Auth.
- [ ] Workspace management entry points.
- [ ] No custom workflows, theme system, or unrelated configuration.

### Milestone C verification

- [ ] Confirm every view respects active Workspace and archive boundaries.
- [ ] Confirm date behavior around local-day boundaries.
- [ ] Confirm search/tag results cannot leak another Workspace.
- [ ] Confirm destructive confirmation behavior.
- [ ] Run `pnpm run build` once and resolve every error.

---

# Milestone D — Account permanence and public experience

## Phase 9 — Anonymous conversion and permanent authentication

- [ ] Build username/email/password signup from the anonymous session.
- [ ] Build sign-in accepting username or email.
- [ ] Upgrade the current anonymous identity without changing Life OS profile ID.
- [ ] Verify all Workspaces and data remain attached after conversion.
- [ ] Build explicit import/discard flow when signing into an existing account
      from an anonymous session.
- [ ] Make import create/preserve a separate Workspace rather than silently
      co-mingling Items.
- [ ] Never discard anonymous data without a confirmed choice.
- [ ] Add sign-out and returning-session behavior.
- [ ] Handle expired sessions, duplicate usernames/emails, wrong passwords,
      network errors, and suspended profiles.
- [ ] Add permanent-account prompts after meaningful use while keeping them
      dismissible and non-blocking.

## Phase 10 — Landing page and onboarding

- [ ] Port the useful content structure from `draft2` later, after the app core
      works.
- [ ] Rebuild it in the `draft3` visual system rather than copying CSS/code.
- [ ] Explain the balance-system promise and capture-first workflow.
- [ ] Provide a direct “Try Life OS” path that creates anonymous access smoothly.
- [ ] Provide sign-in for returning users.
- [ ] Keep `/` lightweight and responsive as a client-rendered route.
- [ ] Add basic metadata, favicon, robots behavior, and accessible content.
- [ ] Let signup optionally rename the default Workspace without making
      onboarding long.

## Phase 11 — Responsive UX, accessibility, and resilience

- [ ] Review every surface at desktop, tablet, and narrow mobile widths.
- [ ] Verify sidebar, Workspace menu, Inbox drawer, Item inspector, dialogs, and
      calendar stacking.
- [ ] Normalize minimum touch targets, keyboard order, focus rings, dialog focus
      trapping, Escape, and focus restoration.
- [ ] Respect reduced motion and avoid decorative motion blocking input.
- [ ] Handle long titles, usernames, Workspace names, empty data, and realistic
      larger lists.
- [ ] Add consistent Loading/Errored/empty/reconnecting affordances.
- [ ] Verify realtime updates across two browser sessions.
- [ ] Verify optimistic failure and reconnect recovery.
- [ ] Prevent double submits and destructive action races.
- [ ] Check common Chromium, Firefox, and mobile browser behavior manually.
- [ ] Keep PWA installation/offline mutation outside this MVP milestone.

---

# Milestone E — Administration and launch

## Phase 12 — Admin foundation and optional launch panel

Backend protection is required; UI breadth may be reduced if core quality needs
attention.

- [ ] Add `role` and suspension enforcement to profile helpers.
- [ ] Manually assign the first production `admin` role in Convex dashboard.
- [ ] Add guarded `/app/admin` route only if an admin UI is implemented.
- [ ] Provide basic counts/operational overview without exposing private content
      by default.
- [ ] Design user suspension and administrator role management.
- [ ] Ensure at least one admin cannot accidentally remove the final admin if
      role management ships.
- [ ] Restrict seed/reset to admin and explicitly selected demo/development
      Workspaces.
- [ ] Never offer a broad reset of arbitrary public-user data.
- [ ] Record destructive admin actions if destructive controls ship.
- [ ] Leave advanced admin requirements documented for later product review.

## Phase 13 — Launch readiness

### 13.1 Manual critical-path verification

- [ ] Fresh browser → anonymous identity → default Workspace.
- [ ] Workspace create, rename, switch, archive, restore.
- [ ] Area create, edit, archive, restore, permanent delete.
- [ ] Quick capture → Inbox → type/Area assignment.
- [ ] Item edit, child creation, move, complete, archive, restore, delete.
- [ ] Today, Upcoming, Area detail/calendar, Tags, Search, Archive, Settings.
- [ ] Anonymous conversion preserves all data.
- [ ] Returning sign-in works with username and email.
- [ ] Existing-account import/discard flow is explicit and safe.
- [ ] Unauthorized IDs and admin routes are rejected server-side.
- [ ] Two sessions receive realtime updates.
- [ ] Failure/reconnect paths recover without data corruption.
- [ ] Desktop, tablet, and mobile critical flows are polished.

### 13.2 Production configuration

- [ ] Confirm Better Auth secret/site URL and trusted origins in the production
      Convex deployment without recording secret values.
- [ ] Confirm Netlify points only to production Convex URLs.
- [ ] Confirm development remains pointed at development Convex.
- [ ] Review schema changes for existing production data compatibility.
- [ ] Prepare one-time manual admin-role assignment after account creation.
- [ ] Confirm no development seed/reset controls are exposed to normal users.
- [ ] Confirm SPA redirects for `/app/*`.

### 13.3 Final gates

- [ ] Run `pnpm run format`.
- [ ] Run `pnpm run ready`.
- [ ] Review the final diff for secrets, debug code, fixed IDs, development URLs,
      and accidental `draft2` code.
- [ ] Commit/push only after the production checklist is satisfied.
- [ ] Verify Netlify deployment completes.
- [ ] Smoke-test the deployed production critical path.
- [ ] Assign first admin role manually if the admin capability ships.
- [ ] Record known non-blocking limitations for the next revision.

---

# Deferred immediately after V1

- Installable PWA manifest/service-worker work and offline expectations.
- Collaboration, invitations, and Workspace membership roles.
- Rich admin analytics and support tooling.
- Automated tests and CI.
- SSR/SEO architecture beyond basic SPA metadata.
- Recurring tasks, external calendars, templates, analytics, AI, and other
  explicit V1 non-goals.

# Decision log

- **Area archival:** Area becomes archived; child Item archive flags are not
  rewritten.
- **Item movement:** attached children follow parent; independently moving a
  child to Inbox detaches it.
- **Anonymous storage:** cloud-backed anonymous identity, no parallel local DB.
- **Auth client:** vanilla Better Auth client wrapped by Life OS Solid 2 state;
  no framework-specific Better Auth bindings.
- **Account conflict:** explicit import-or-discard choice.
- **Workspace ownership:** direct single owner for V1.
- **First admin:** manually assign role in Convex dashboard.
- **Optimism:** Solid 2 optimistic overlay over Convex authority; no double
  optimistic layer.
- **Verification:** manual acceptance checks plus milestone builds; zero
  automated tests initially.
