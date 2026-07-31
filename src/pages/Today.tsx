import { createOptimisticStore, For, Show } from "solid-js";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createQuery } from "../convex";
import { Icon } from "../Icon";
import { ItemRow } from "../features/items/ItemRow";
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
    <ItemRow
      item={item()}
      areaName={
        items.areas().find((area) => area._id === item().areaId)?.name ??
        "Inbox"
      }
      onOpen={(id) => panel.openItem(id)}
      onToggleTask={(id, done) => void toggle(id, done)}
    />
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
          <section class="today-progress">
            <div>
              <strong>
                {completed().length} of {rows.length}
              </strong>
              <span>completed today</span>
            </div>
            <i>
              <b
                style={{
                  width: `${rows.length ? (completed().length / rows.length) * 100 : 0}%`,
                }}
              />
            </i>
          </section>
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
