import { For, Show } from "solid-js";
import { api } from "../../convex/_generated/api";
import { createQuery } from "../convex";
import { Icon } from "../Icon";
import {
  compactDateLabel,
  localDateKey,
} from "../features/items/dates";
import { useItems, type ItemView } from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import { itemIcon } from "../features/items/types";
import { useWorkspaces } from "../features/workspaces/context";
import "./Retrieval.css";

export default function Upcoming() {
  const workspaces = useWorkspaces();
  const items = useItems();
  const panel = useItemPanelRoute();
  const today = localDateKey();
  const source = createQuery(
    api.items.listUpcoming,
    () => {
      const workspaceId = workspaces.state.activeWorkspaceId;
      return workspaceId
        ? { workspaceId, afterDate: today, limit: 150 }
        : "skip";
    },
    { initialValue: [] },
  );
  const groups = () => {
    const map = new Map<string, ItemView[]>();
    for (const item of source() ?? []) {
      if (!item.dueDate) continue;
      const group = map.get(item.dueDate) ?? [];
      group.push(item);
      map.set(item.dueDate, group);
    }
    return [...map.entries()];
  };

  return (
    <section class="retrieval-page">
      <header class="retrieval-header">
        <div>
          <span>Plan ahead</span>
          <h2>Upcoming</h2>
          <p>The next 150 dated Tasks and Events in this Workspace.</p>
        </div>
        <button
          type="button"
          class="primary-action"
          onClick={() => panel.createItem()}
        >
          <Icon name="plus" size={17} />
          New Item
        </button>
      </header>
      <Show
        when={groups().length > 0}
        fallback={
          <div class="retrieval-empty">
            <span>
              <Icon name="calendar" size={25} />
            </span>
            <h3>Nothing scheduled yet</h3>
            <p>Future Tasks and Events will appear here in date order.</p>
          </div>
        }
      >
        <div class="retrieval-scroll">
          <For each={groups()} keyed={(group) => group[0]}>
            {(group) => (
              <section class="retrieval-section">
                <header>
                  <h3>{compactDateLabel(group()[0])}</h3>
                  <small>{group()[1].length} items</small>
                </header>
                <For each={group()[1]} keyed={(item) => item._id}>
                  {(item) => (
                    <article
                      class={[
                        "retrieval-row",
                        { done: item().status === "Done" },
                      ]}
                    >
                      <span class="retrieval-icon">
                        <Icon name={itemIcon(item().type)} size={18} />
                      </span>
                      <button
                        type="button"
                        class="retrieval-main"
                        onClick={() => panel.openItem(item()._id)}
                      >
                        <strong>{item().title}</strong>
                        <span>
                          {items
                            .areas()
                            .find((area) => area._id === item().areaId)?.name ??
                            "Inbox"}
                          {item().priority
                            ? ` · Priority ${item().priority}`
                            : ""}
                        </span>
                      </button>
                      <span class="retrieval-badge">{item().type}</span>
                    </article>
                  )}
                </For>
              </section>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
