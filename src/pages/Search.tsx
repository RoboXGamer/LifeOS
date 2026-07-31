import { createSignal, For, Show } from "solid-js";
import { useNavigate, useRouterState } from "@tanstack/solid-router";
import { Icon } from "../Icon";
import { ItemRow } from "../features/items/ItemRow";
import { useItems, type ItemType } from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import type { AppRouteSearch } from "../router";
import "./Retrieval.css";

const types: Array<ItemType | "All"> = [
  "All",
  "Task",
  "Note",
  "Event",
  "Expense",
  "Payment",
];

export default function Search() {
  const items = useItems();
  const panel = useItemPanelRoute();
  const navigate = useNavigate();
  const location = useRouterState({ select: (state) => state.location });
  const query = () => ((location().search as AppRouteSearch).q ?? "").trim();
  const [draft, setDraft] = createSignal(query());
  const [type, setType] = createSignal<ItemType | "All">("All");
  const results = () => {
    const term = query().toLowerCase();
    if (!term) return [];
    return items.activeItems.filter((item) => {
      const area =
        items.areas().find((entry) => entry._id === item.areaId)?.name ??
        "Inbox";
      const matchesText =
        `${item.title} ${item.description ?? ""} ${item.type ?? ""} ${item.tags.join(" ")} ${area}`
          .toLowerCase()
          .includes(term);
      return matchesText && (type() === "All" || item.type === type());
    });
  };
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    void navigate({
      to: "/app/search",
      search: { q: draft().trim() },
      replace: true,
    });
  };

  return (
    <section class="retrieval-page search-page">
      <header class="retrieval-header">
        <div>
          <span>Everything, instantly</span>
          <h2>Search</h2>
          <p>Find Items by title, description, type, tag, or Area.</p>
        </div>
      </header>
      <form class="full-search" onSubmit={submit}>
        <Icon name="search" size={20} />
        <input
          value={draft()}
          autofocus
          placeholder="Search your Life OS…"
          onInput={(event) => setDraft(event.currentTarget.value)}
        />
        <button type="submit">Search</button>
      </form>
      <div class="full-search-filters">
        <For each={types}>
          {(value) => (
            <button
              class={{ active: type() === value }}
              onClick={() => setType(value)}
            >
              {value}
            </button>
          )}
        </For>
        <span>{results().length} results</span>
      </div>
      <Show
        when={query()}
        fallback={
          <div class="retrieval-empty">
            <span>
              <Icon name="search" size={25} />
            </span>
            <h3>Search everything</h3>
            <p>Try a title, description, Item type, tag, or Area name.</p>
          </div>
        }
      >
        <div class="retrieval-scroll search-result-list">
          <For
            each={results()}
            fallback={
              <div class="retrieval-empty">
                <h3>No results</h3>
                <p>Try another phrase or Item type.</p>
              </div>
            }
            keyed={(item) => item._id}
          >
            {(item) => (
              <ItemRow
                item={item()}
                areaName={
                  items.areas().find((area) => area._id === item().areaId)
                    ?.name ?? "Inbox"
                }
                onOpen={(id) => panel.openItem(id)}
                onToggleTask={(id, done) => void items.setTaskDone(id, done)}
              />
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
