import { createSignal, For, Show } from "solid-js";
import { api } from "../../../convex/_generated/api";
import { createQuery } from "../../convex";
import { Icon } from "../../Icon";
import { useWorkspaces } from "../workspaces/context";
import { useItemPanelRoute } from "./routing";
import { itemIcon } from "./types";
import "../../pages/Organization.css";

export function SearchPanel(props: { onClose: () => void }) {
  const workspaces = useWorkspaces();
  const panel = useItemPanelRoute();
  const [input, setInput] = createSignal("");
  const [searchTerm, setSearchTerm] = createSignal("");
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const source = createQuery(
    api.items.search,
    () => {
      const workspaceId = workspaces.state.activeWorkspaceId;
      const term = searchTerm();
      return workspaceId && term
        ? { workspaceId, searchTerm: term, limit: 40 }
        : "skip";
    },
    { initialValue: [] },
  );
  const change = (value: string) => {
    setInput(value);
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => setSearchTerm(value.trim()), 140);
  };
  const open = (itemId: string) => {
    props.onClose();
    panel.openItem(itemId);
  };

  return (
    <section
      class="search-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Search Items"
      onClick={(event) => event.stopPropagation()}
    >
      <div class="search-input-row">
        <Icon name="search" size={19} />
        <input
          id="global-search-input"
          value={input()}
          placeholder="Search Item titles…"
          autocomplete="off"
          onInput={(event) => change(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") props.onClose();
          }}
        />
        <button type="button" onClick={props.onClose}>
          Esc
        </button>
      </div>
      <div class="search-results">
        <Show
          when={searchTerm()}
          fallback={
            <p class="search-empty">
              Search is limited to active Items in the current Workspace.
            </p>
          }
        >
          <Show
            when={(source() ?? []).length > 0}
            fallback={<p class="search-empty">No matching Items.</p>}
          >
            <For each={source() ?? []} keyed={(item) => item._id}>
              {(item) => (
                <button
                  type="button"
                  class="search-result"
                  onClick={() => open(item()._id)}
                >
                  <span>
                    <Icon name={itemIcon(item().type)} size={17} />
                  </span>
                  <div>
                    <strong>{item().title}</strong>
                    <small>
                      {item().type ?? "Unsorted"}
                      {item().tags.length
                        ? ` · ${item().tags.slice(0, 2).join(", ")}`
                        : ""}
                    </small>
                  </div>
                  <Icon name="chevronRight" size={16} />
                </button>
              )}
            </For>
          </Show>
        </Show>
      </div>
    </section>
  );
}
