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
