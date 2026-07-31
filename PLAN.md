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

## Execution checkpoint

- [x] Milestone A / Phases 1–3 Foundation implemented on the development
      deployment.
- [x] Anonymous auth bootstrap, profile creation, default Workspace, and
      default Tags verified in the browser.
- [x] Active Workspace switching and complete Workspace lifecycle verified
      against live Convex data.
- [x] Complete Area lifecycle verified, including optimistic updates,
      archive/restore, affected counts, and typed permanent deletion.
- [x] Desktop and phone layouts manually inspected; the existing draft3 shell
      and navigation remain intact.
- [x] Milestone B / Phases 4–5 implemented against the development deployment.
- [x] Title-only Inbox capture, typed Area organization, editing, completion,
      nesting, family movement, archive/restore, and rejected-mutation rollback
      verified in the browser.
- [x] Route-aware inspector and global Inbox verified at desktop and phone
      widths without changing the draft3 navigation shell.
- [x] Milestone C / Phases 6–8 implemented locally: daily retrieval, Area
      calendar, Tags, global Search, Archive, and Settings now form the next
      complete product slice.
- [ ] Manual browser verification for Milestone C intentionally deferred at the
      user's request; this checkpoint uses the production build as its gate.

Implementation note: Better Auth's vanilla external session store is adapted to
an explicit Solid-owned readiness signal and loading/error boundary. `<Loading>`
is reserved for Solid async computations; wrapping the external store in a fake
async computation would add indirection without improving lifecycle ownership.

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
- [x] Confirm every schema/function change against the development deployment.
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

- [x] Inventory the existing `App.tsx`, `App.css`, sidebar controls, icons,
      responsive behavior, and Areas layout before editing.
- [x] Record which `draft2` behaviors are useful, without copying its component
      architecture or CSS.
- [x] Keep the current sidebar button order and visual treatment.
- [x] Define responsive breakpoints and shell states for desktop, tablet, and
      mobile.
- [x] Define the content contract for page headers, loading, empty, error, and
      not-found states.

Acceptance:

- Existing Areas presentation and sidebar identity remain recognizable.
- Shell supports a content page, global Inbox panel, Workspace menu, and future
  Item inspector without page-specific layout hacks.

### 1.2 Establish the route tree

- [x] Move router construction out of `src/index.tsx` into a focused router
      module.
- [x] Define `/` as the future landing route.
- [x] Define `/app` redirect/default behavior.
- [x] Define `/app/areas` and `/app/areas/$areaId`.
- [x] Reserve `/app/areas/$areaId/calendar`, `/app/today`, `/app/upcoming`,
      `/app/tags`, `/app/archive`, and `/app/settings`.
- [x] Define route search validation for `item`, `mode`, `parent`, and other
      inspector state.
- [x] Add a not-found route and safe invalid-Workspace/Area behavior.
- [x] Ensure direct navigation and Netlify SPA fallback work for every route.

Acceptance:

- Refreshing any declared route loads the SPA.
- Browser Back/Forward preserves page and validated inspector state.
- Placeholder routes do not require changes to the existing sidebar.

### 1.3 Organize code by responsibility

- [x] Create focused locations for app shell, routes/pages, reusable UI,
      feature-domain code, auth, and internal Convex adapters.
- [x] Keep Convex server functions grouped by domain.
- [x] Introduce shared domain validators/constants instead of duplicated string
      unions.
- [x] Avoid a centralized `App.tsx` state machine.

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

- [x] Add Prettier as a development dependency.
- [x] Add `format` and `format:check` scripts.
- [x] Add `ready` script that runs formatting verification followed by the
      existing typecheck/build pipeline.
- [x] Do not introduce ESLint, a test runner, CI, or GitHub Actions.

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

- [x] Add compatible `better-auth` and `@convex-dev/better-auth` versions.
- [x] Mount the Better Auth Convex component in `convex/convex.config.ts`.
- [x] Add `convex/auth.config.ts`.
- [x] Add `convex/auth.ts`, `convex/http.ts`, and trusted-origin normalization
      based on the Aravali reference.
- [x] Enable email/password, username, and anonymous plugins.
- [x] Use Better Auth's framework-agnostic vanilla JavaScript client; do not
      import its Solid or React client bindings.
- [x] Build a small Life OS auth adapter that translates vanilla client session
      events and access-token fetching into locally verified Solid 2 state.
- [x] Keep subscriptions/listeners owned and disposed according to Solid 2
      ownership semantics.
- [x] Connect auth token loading from that adapter to the internal `src/convex`
      client/provider.
- [x] Model auth readiness with a Solid-owned loading/error boundary appropriate
      for Better Auth's external vanilla store.
- [x] Treat the adapter as the only frontend module allowed to know Better
      Auth's client event/session shape.
- [x] Prevent duplicate anonymous session creation during startup races.
- [x] Keep the frontend usable while initial anonymous bootstrap is resolving.

Acceptance:

- A new browser session receives one anonymous Better Auth identity.
- Reload retains the same anonymous identity.
- Convex functions can resolve the authenticated identity.
- Auth failures produce a recoverable UI rather than an empty app.

### 2.2 Define the revised schema

- [x] Add `profiles` with auth identity key, optional username/email for
      anonymous state, anonymous/permanent state, role, suspension state,
      username-change timestamp, created/updated timestamps.
- [x] Add unique/indexed normalized username support.
- [x] Add `workspaces.ownerId` and lifecycle timestamps.
- [x] Keep Area `name`, `description`, `icon`, `color`, `archived`, and
      timestamps.
- [x] Remove Item `color`, `favorite`, and embedded `tags`.
- [x] Make Item `type` optional only for Inbox capture.
- [x] Encode Item type/status/finance fields with literal unions and server
      validators.
- [x] Add `tags` and `itemTags`.
- [x] Retain waitlist data without coupling it to app profiles.
- [x] Rename/add indexes so names describe all indexed fields.
- [x] Add indexes for ownership, Workspace-scoped active views, parent lookup,
      dates, archive, normalized tags, and item-tag relationships.
- [x] Decide whether the active Workspace is persisted on the profile or stored
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
- [x] Define Workspace and Area name/description limits.
- [ ] Define exact Item type, status, priority, amount, settlement, due-date,
      and description rules.
- [ ] Require an Item type when `areaId` is non-null.
- [ ] Validate single-level parent rules and shared location.
- [ ] Validate Tag normalization and Workspace uniqueness.
- [x] Reject cross-Workspace IDs even when the documents exist.
- [ ] Use Convex argument and return validators for public functions.

### 2.4 Build authorization helpers

- [x] Implement `requireProfile`.
- [x] Implement `requireActiveProfile`.
- [x] Implement `requireWorkspaceOwner`.
- [x] Implement `requireAreaOwner`.
- [x] Implement `requireItemOwner`.
- [x] Implement `requireAdmin`.
- [x] Derive identity on the server; never accept a user ID for authorization.
- [x] Apply ownership checks to every implemented user-owned query and mutation,
      including reads.
- [x] Keep admin authorization server-side even if UI guards exist.

### 2.5 Bootstrap profile and default Workspace

- [x] Create an idempotent bootstrap mutation for profile, default Workspace,
      and default Tags.
- [x] Use a stable default name such as `My Life` for anonymous startup.
- [x] Allow the default Workspace to be renamed through normal Workspace CRUD.
- [x] Persist a valid active Workspace.
- [x] Repair only safe missing bootstrap records; never overwrite user data.

Acceptance:

- New and returning identities always resolve to a valid profile and Workspace.
- Repeated bootstrap calls do not create duplicates.
- One user cannot read or mutate another user's Workspace by guessing IDs.

## Phase 3 — Internal data layer and Workspace/Area vertical slice

### 3.1 Finish the internal Solid–Convex abstraction

- [x] Review `client`, `connection`, `context`, `query`, `mutation`, and `action`
      as one lifecycle.
- [x] Add auth-aware token refresh/reconnect behavior.
- [x] Define consistent `skip`, initial value, loading, error, reconnect, and
      disposal behavior.
- [x] Keep the abstraction internal to Life OS.
- [x] Expose typed feature-facing primitives rather than raw client access.
- [x] Ensure subscriptions do not leak when route arguments change.
- [x] Define one error-normalization shape for user-facing mutations.

### 3.2 Establish the optimistic convention

- [x] Create feature stores using Solid 2 `createOptimisticStore` over
      authoritative Convex query results.
- [x] Wrap mutations in Solid 2 `action`.
- [x] Apply the visible optimistic draft before yielding the Convex mutation.
- [x] Reconcile directly with the authoritative live subscription after server
      completion; do not call `refresh` on an external Convex source.
- [ ] Use `affects` only for values known to change but not optimistically shown.
- [ ] Use a co-written optimistic process flag for “Saving…” affordances rather
      than misusing `isPending`.
- [x] Surface mutation errors inline and allow retry where meaningful.
- [x] Do not apply Convex `withOptimisticUpdate` to an entity already covered by
      a Solid optimistic store.
- [ ] Confirm concurrent create/update/archive actions resolve without stale
      overlays or flicker.

### 3.3 Workspace API and UI

- [x] Query all active owner Workspaces with a bounded result.
- [x] Query archived Workspaces for Archive/Settings.
- [x] Create Workspace with normalized validation and default Tags.
- [x] Rename Workspace.
- [x] Switch active Workspace and update all scoped subscriptions.
- [x] Archive and restore Workspace.
- [x] Permanently delete an archived Workspace with typed confirmation and
      affected counts.
- [x] Build the compact avatar-attached Workspace switcher.
- [ ] Include create, rename, archive, restore, account, and sign-in entry
      points without redesigning the sidebar.
- [x] Handle zero/invalid active Workspace through bootstrap fallback.

### 3.4 Area API and UI

- [x] Replace the fixed `WORKSPACE_ID` with active Workspace state.
- [x] Query active Areas by Workspace through an index.
- [x] Query archived Areas separately.
- [x] Create Area with name, optional description, icon, and color.
- [x] Edit Area fields.
- [x] Archive Area without rewriting Item archive flags.
- [x] Restore Area.
- [x] Permanently delete an archived Area and its bounded relationships.
- [x] Add create/edit UI consistent with the current Areas grid.
- [x] Add mindful delete confirmation with affected Item count and typed Area
      name.
- [x] Add empty, loading, error, retry, and optimistic states.
- [x] Make controls keyboard-accessible and touch-friendly.

### 3.5 Foundation milestone verification

Manual verification:

- [x] First visit creates one anonymous profile and default Workspace.
- [x] Reload retains identity, active Workspace, and Areas.
- [x] Workspace create/rename/switch/archive/restore works in realtime.
- [x] Area create/edit/archive/restore/delete works optimistically.
- [x] Failed optimistic mutations reconcile to the authoritative live source and
      surface their server error.
- [x] Cross-Workspace IDs are rejected by shared server-side ownership helpers.
- [x] Desktop and mobile layouts remain polished; tablet follows the same
      responsive shell contract.
- [x] Direct `/app/areas` refresh succeeds.
- [x] Run `pnpm run build` once and resolve every error.

Milestone A is complete when all Phase 1–3 acceptance criteria pass.

---

# Milestone B — Core capture and organization

## Phase 4 — Item domain and route-aware inspector

### 4.1 Item server API

- [x] Implement bounded/indexed active Item queries by Workspace and Area.
- [x] Implement Item-by-ID query with ownership enforcement.
- [x] Create untyped Inbox Item with title only.
- [x] Create typed Item directly in an Area.
- [x] Update shared and type-specific fields.
- [x] Complete/reopen Tasks.
- [x] Move Item between Areas.
- [x] Move Item back to Inbox while preserving metadata.
- [x] Create and edit single-level children.
- [x] Move a parent family together.
- [x] Detach a child moved independently to Inbox.
- [x] Archive and restore Item families.
- [x] Enforce archived-Area visibility in all active queries.

### 4.2 Item optimistic store

- [x] Design stable keyed optimistic projections for list membership changes.
- [x] Handle create/update/move/archive/complete actions immediately.
- [x] Prevent duplicate optimistic records when Convex subscription catches up.
- [x] Preserve field edits when an Item moves between live lists.
- [x] Display targeted failure/retry state without losing typed form input.

### 4.3 Inspector routing and responsive shell

- [x] Validate `item`, `mode`, and optional creation context in route search.
- [x] Build desktop right-side inspector.
- [x] Build mobile full-screen sheet using the same component/state.
- [x] Support view, create, edit, archived, and child-create modes.
- [x] Make browser Back close/restore inspector context.
- [x] Handle missing, deleted, unauthorized, and moved Items safely.
- [x] Add focus management, Escape behavior, focus return, and accessible labels.

### 4.4 Item form

- [x] Title and optional type for Inbox capture/editing.
- [x] Require type before Area assignment.
- [x] Type-specific status/amount/settled fields.
- [x] Area, due date, priority, description, tags, and parent.
- [x] Preserve fields when changing type but clear invalid persisted fields on
      save with an understandable warning.
- [x] Provide archive/restore controls.

## Phase 5 — Global Inbox and quick capture

- [x] Build the global slide-out panel without adding a sidebar destination.
- [x] Connect the existing Inbox sidebar button.
- [x] Query active `areaId: null` Items in the active Workspace.
- [x] Implement title-only quick capture with immediate optimistic insertion.
- [x] Add keyboard-friendly capture and sensible focus return.
- [x] Open an Inbox Item in the route-aware inspector over the current page.
- [x] Organize Item by type and Area.
- [x] Remove it from Inbox immediately after successful/optimistic assignment.
- [x] Support moving organized Items back to Inbox.
- [x] Add empty, reconnecting, failure, and retry states.
- [x] Ensure mobile overlay, safe-area, touch targets, and scroll locking feel
      intentional.
- [x] Add a gentle permanent-account prompt after meaningful anonymous usage;
      do not block capture.

### Milestone B verification

- [x] Capture, organize, edit, complete, move, nest, archive, and restore Items.
- [x] Verify parent-family movement rules.
- [x] Verify all optimistic rollback paths manually.
- [x] Verify browser navigation around the inspector.
- [x] Verify desktop/tablet/mobile interaction.
- [x] Run `pnpm run build` once and resolve every error.

---

# Milestone C — Daily retrieval and lifecycle

## Phase 6 — Area detail, Today, Upcoming, and calendar

### 6.1 Area detail

- [x] Build `/app/areas/$areaId`.
- [x] List top-level Items and one child level.
- [x] Add type/status/priority/date affordances without visual clutter.
- [x] Support direct Item creation in the Area.
- [x] Reuse the inspector for every Item action.

### 6.2 Today

- [x] Define client-local `YYYY-MM-DD` behavior explicitly.
- [x] Pass current date into Convex queries; do not read wall clock in queries.
- [x] Query incomplete Tasks due today with correct Workspace/Area/archive rules.
- [x] Complete/reopen optimistically.
- [x] Keep completed content discoverable without clutter.

### 6.3 Upcoming

- [x] Query future dated Items with bounded pagination/order.
- [x] Group or label dates clearly.
- [x] Include relevant Tasks and Events without mixing semantics confusingly.
- [x] Reuse the inspector and optimistic actions.

### 6.4 Area calendar

- [x] Build `/app/areas/$areaId/calendar`.
- [x] Show dated Items for the selected range.
- [x] Navigate between list and calendar without losing selected Area.
- [x] Create an Item prefilled with selected date through inspector routing.
- [x] Keep the initial calendar bounded and accessible; avoid external calendar
      sync or scheduling complexity.

## Phase 7 — Tags and global Search

### 7.1 Tags

- [x] Create/reuse normalized Workspace Tag during Item save.
- [x] Maintain `itemTags` transactionally with Item changes.
- [x] Rename Tag and preserve relationships.
- [x] Delete unused Tag safely.
- [x] Query Tags and counts without unbounded document arrays.
- [x] Build `/app/tags` and tagged Item results.

### 7.2 Search

- [x] Add appropriate Convex search index for Item title and filterable
      Workspace/archive fields.
- [x] Decide the bounded search contract for description/type/tag/Area
      enrichment.
- [x] Debounce input without making results feel delayed.
- [x] Provide a global search trigger without changing sidebar navigation.
- [x] Support keyboard access and mobile presentation.
- [x] Open results in the shared inspector.

Search contract: search active Item titles in the selected Workspace, return at
most 40 matches, then enrich those bounded matches with type and Tag context.
Area visibility is enforced after search so archived Areas cannot surface.

## Phase 8 — Archive and Settings

### 8.1 Archive

- [x] Build archived Item and Area sections.
- [x] Restore Items, families, Areas, and Workspaces safely.
- [x] Permanently delete individual archived Item after explicit confirmation.
- [x] Require typed name for parent-family, Area, or Workspace deletion.
- [x] Show affected counts before destructive deletion.
- [x] Ensure active data cannot be permanently deleted through these endpoints.

### 8.2 Settings

- [x] Account summary and anonymous/permanent status.
- [x] Username change form with validation and server cooldown.
- [x] Email/session/sign-out controls supplied safely by Better Auth.
- [x] Workspace management entry points.
- [x] No custom workflows, theme system, or unrelated configuration.

### Milestone C verification

- [x] Confirm every view respects active Workspace and archive boundaries by
      endpoint ownership and filter inspection.
- [ ] Confirm date behavior around local-day boundaries in the browser.
- [x] Confirm search/tag results cannot leak another Workspace by endpoint
      ownership and filter inspection.
- [x] Confirm destructive confirmation behavior by endpoint and UI inspection.
- [x] Run `pnpm run build` once and resolve every error.

---

# Milestone C.5 — Frontend productization and polish

This milestone restores the product density and interaction quality proven in
`draft2` without copying its centralized state or component architecture.
`draft3` remains authoritative for routing, Convex data, optimistic actions,
the compact sidebar, global Inbox drawer, and route-aware Item inspector.

## Phase 8.5 — Product UI refactor

- [x] Establish shared page headers, Item rows, badges, metric cards, filters,
      empty states, and responsive desktop/mobile presentation.
- [x] Upgrade Areas with richer identity, visual editing, useful counts, and
      safe desktop Inbox-to-Area organization.
- [x] Rebuild Area Detail around a summary, metrics, search/type filters, dense
      metadata, expandable children, and inline Task actions.
- [x] Make Week the default Area calendar view, with Agenda and Month modes,
      bounded range queries, quick date creation, overdue context, and shared
      inspector actions.
- [x] Restore Today progress, strengthen Upcoming grouping, broaden Search, and
      polish Tags, Archive, Settings, Inbox, and the Item inspector.
- [x] Use a full Search results route reached from the global panel without
      adding a sidebar button.
- [x] Conditionally mount modal surfaces, trap/restore focus, honor Escape and
      reduced motion, and remove Solid strict reactive-read warnings.
- [x] Review desktop table and mobile card layouts in code, then run the milestone build
      gate once.

Acceptance:

- Draft 2's useful information hierarchy is present across the app while Draft
  3's shell and server-backed behavior remain intact.
- Area Detail and Calendar feel like complete product surfaces rather than CRUD
  verification screens.
- Shared visual primitives prevent the refactor from becoming another
  `V1Screens.tsx` monolith.
- Search and overlays are keyboard-safe and hidden controls are not left
  interactive.
- `pnpm run build` passes.

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
