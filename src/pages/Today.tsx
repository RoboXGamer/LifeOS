import { createOptimisticStore, For, Show } from "solid-js";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createQuery } from "../convex";
import { Icon } from "../Icon";
import { localDateKey, longDateLabel } from "../features/items/dates";
import { useItems, type ItemView } from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import { useWorkspaces } from "../features/workspaces/context";
import "./Retrieval.css";

export default function Today() {
  const workspaces = useWorkspaces();
  const items = useItems();
  const panel = useItemPanelRoute();
  const today = localDateKey();
  const source = createQuery(
    api.items.listToday,
    () => {
      const workspaceId = workspaces.state.activeWorkspaceId;
      return workspaceId ? { workspaceId, date: today } : "skip";
    },
    { initialValue: [] },
  );
  const [rows, setRows] = createOptimisticStore<ItemView[]>(
    () => source() ?? [],
    [],
    { key: "_id" },
  );
  const incomplete = () => rows.filter((item) => item.status !== "Done");
  const completed = () => rows.filter((item) => item.status === "Done");

  const toggle = async (itemId: Id<"items">, done: boolean) => {
    setRows((draft) => {
      const item = draft.find((entry) => entry._id === itemId);
      if (item) item.status = done ? "Done" : "Todo";
    });
    await items.setTaskDone(itemId, done);
  };

  const row = (item: () => ItemView) => (
    <article class={["retrieval-row", { done: item().status === "Done" }]}>
      <button
        type="button"
        class="retrieval-check"
        aria-label={
          item().status === "Done"
            ? `Mark ${item().title} incomplete`
            : `Complete ${item().title}`
        }
        onClick={() => toggle(item()._id, item().status !== "Done")}
      >
        <Icon name="checkSquare" size={18} />
      </button>
      <button
        type="button"
        class="retrieval-main"
        onClick={() => panel.openItem(item()._id)}
      >
        <strong>{item().title}</strong>
        <span>
          {items.areas().find((area) => area._id === item().areaId)?.name ??
            "Inbox"}
          {item().priority ? ` · Priority ${item().priority}` : ""}
        </span>
      </button>
      <span class="retrieval-badge">{item().status ?? "Todo"}</span>
    </article>
  );

  return (
    <section class="retrieval-page">
      <header class="retrieval-header">
        <div>
          <span>Focus</span>
          <h2>Today</h2>
          <p>{longDateLabel(today)}</p>
        </div>
        <button
          type="button"
          class="primary-action"
          onClick={() => panel.createItem({ date: today })}
        >
          <Icon name="plus" size={17} />
          Add for today
        </button>
      </header>
      <Show
        when={rows.length > 0}
        fallback={
          <div class="retrieval-empty">
            <span>
              <Icon name="checkSquare" size={25} />
            </span>
            <h3>Your day is clear</h3>
            <p>Tasks dated today will gather here automatically.</p>
          </div>
        }
      >
        <div class="retrieval-scroll">
          <section class="retrieval-section">
            <header>
              <h3>Open</h3>
              <small>{incomplete().length} tasks</small>
            </header>
            <For each={incomplete()} keyed={(item) => item._id}>
              {row}
            </For>
          </section>
          <Show when={completed().length > 0}>
            <details class="retrieval-section">
              <summary>Completed · {completed().length}</summary>
              <For each={completed()} keyed={(item) => item._id}>
                {row}
              </For>
            </details>
          </Show>
        </div>
      </Show>
    </section>
  );
}
