import { For, Show, createSignal } from "solid-js";
import type { Area, Item, ItemType } from "../types";
import { Icon, type IconName } from "./Icon";
import "./AreaDetail.css";

const itemTypes: (ItemType | "All")[] = ["All", "Task", "Note", "Event", "Expense", "Payment"];

export const itemTypeIcon = (type?: ItemType): IconName => {
  if (type === "Note") return "book";
  if (type === "Event") return "calendar";
  if (type === "Expense") return "briefcase";
  if (type === "Payment") return "clock";
  return "checkSquare";
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
};

const formatMoney = (value?: number) => value === undefined
  ? ""
  : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export function AreaWorkspace(props: {
  area: Area;
  items: () => Item[];
  selectedId: () => string | null;
  onBack: () => void;
  onNewItem: () => void;
  onEditArea: () => void;
  onSelectItem: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onCyclePriority: (id: string) => void;
}) {
  const [search, setSearch] = createSignal("");
  const [typeFilter, setTypeFilter] = createSignal<ItemType | "All">("All");
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set(["college-project"]));

  const activeItems = () => props.items().filter(item => !item.archived);
  const byPriority = (a: Item, b: Item) => (a.priority ?? 4) - (b.priority ?? 4) || a.createdAt.localeCompare(b.createdAt);
  const topLevelItems = () => activeItems().filter(item => !item.parentId).sort(byPriority);
  const childItems = (parentId: string) => activeItems().filter(item => item.parentId === parentId);

  const matches = (item: Item) => {
    const query = search().trim().toLowerCase();
    if (query && !`${item.title} ${(item.tags ?? []).join(" ")}`.toLowerCase().includes(query)) return false;
    if (typeFilter() !== "All" && item.type !== typeFilter()) return false;
    return true;
  };

  const rows = () => {
    const output: { item: Item; depth: number; parentTitle?: string }[] = [];
    for (const parent of topLevelItems()) {
      const children = childItems(parent.id);
      const matchingChildren = children.filter(matches);
      if (matches(parent) || matchingChildren.length) output.push({ item: parent, depth: 0 });
      if (expanded().has(parent.id)) {
        for (const child of matchingChildren) output.push({ item: child, depth: 1, parentTitle: parent.title });
      }
    }
    return output;
  };

  const toggleExpanded = (id: string) => {
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const count = (type?: ItemType) => topLevelItems().filter(item => !type || item.type === type).length;
  const financeCount = () => count("Expense") + count("Payment");
  return (
    <section class={`area-workspace tone-${props.area.tone}`}>
      <header class="workspace-topbar">
        <button class="breadcrumb" onClick={props.onBack}><span>Areas</span><Icon name="chevronRight" size={14}/><strong>{props.area.name}</strong></button>
        <div class="workspace-actions">
          <button onClick={props.onEditArea}><Icon name="edit" size={17}/> Edit Area</button>
          <button class="primary-action" onClick={props.onNewItem}><Icon name="plus" size={18}/> New Item</button>
        </div>
      </header>

      <section class="area-summary">
        <div class="summary-art" aria-hidden="true">
          <span class="summary-tab"/><span class="summary-shape"/><span class="summary-dots"/>
          <Icon name={props.area.artIcon ?? props.area.icon} size={52}/>
        </div>
        <div class="summary-copy">
          <h1>{props.area.name}</h1>
          <p>{props.area.description}</p>
          <div class="summary-stats">
            <span><strong>{count()}</strong><small>Items</small></span>
            <span><strong>{count("Task")}</strong><small>Tasks</small></span>
            <span><strong>{count("Note")}</strong><small>Notes</small></span>
            <span><strong>{count("Event")}</strong><small>Event</small></span>
            <span><strong>{financeCount()}</strong><small>Finances</small></span>
          </div>
        </div>
      </section>

      <section class="items-section">
        <div class="items-toolbar">
          <label class="search-box">
            <input value={search()} onInput={event => setSearch(event.currentTarget.value)} placeholder="Search items..."/>
            <Icon name="search" size={18}/>
          </label>
        </div>

        <div class="type-tabs">
          <For each={itemTypes}>
            {type => <button class={{ active: typeFilter() === type }} onClick={() => setTypeFilter(type)}>{type}</button>}
          </For>
        </div>

        <div class="items-table">
          <div class="table-head">
            <span>Title</span><span>Type</span><span>Status</span><span>Priority</span><span>Due Date</span><span>Tags</span><span>Parent</span><span/>
          </div>
          <div class="table-body">
            <For each={rows()} keyed={row => row.item.id}>
              {row => {
                const item = () => row().item;
                const children = () => childItems(item().id);
                const selected = () => props.selectedId() === item().id;
                return (
                  <div
                    class={["item-row", { selected: selected(), child: row().depth === 1 }]}
                    onClick={() => props.onSelectItem(item().id)}
                  >
                    <span class="title-cell" style={{ "padding-left": `${row().depth * 34 + 10}px` }}>
                      <Show when={row().depth === 1}><i class="child-branch"/></Show>
                      <button
                        class={["row-check", { checked: item().status === "Done" }]}
                        disabled={item().type !== "Task"}
                        aria-label={`Toggle ${item().title}`}
                        onClick={event => { event.stopPropagation(); props.onToggleComplete(item().id); }}
                      >
                        <Show when={item().status === "Done"}><span>✓</span></Show>
                      </button>
                      <Show when={children().length > 0}>
                        <button class="expand-row" aria-label={`Toggle children for ${item().title}`} onClick={event => { event.stopPropagation(); toggleExpanded(item().id); }}>
                          <Icon name={expanded().has(item().id) ? "chevronDown" : "chevronRight"} size={15}/>
                        </button>
                      </Show>
                      <Icon name={itemTypeIcon(item().type)} size={16}/>
                      <strong>{item().title}</strong>
                    </span>
                    <span><em class={`badge type-${item().type?.toLowerCase()}`}>{item().type}</em></span>
                    <span>
                      <Show when={item().type === "Task"}><em class={`badge status-${item().status?.toLowerCase().replace(" ", "-")}`}>{item().status}</em></Show>
                      <Show when={item().type === "Expense" || item().type === "Payment"}><em class={`badge status-${item().isSettled ? "settled" : "unsettled"}`}>{item().isSettled ? "Settled" : "Unsettled"}</em></Show>
                      <Show when={!item().status && item().type !== "Expense" && item().type !== "Payment"}>—</Show>
                    </span>
                    <button class="priority-cell" title="Cycle priority" onClick={event => { event.stopPropagation(); props.onCyclePriority(item().id); }}><Show when={item().priority} fallback="—"><em class={`badge priority-${item().priority}`}>P{item().priority}</em></Show></button>
                    <span class={{ "date-positive": item().status === "Done" || item().type === "Event" }}>{formatDate(item().dueDate)}</span>
                    <span><Show when={item().tags?.[0]} fallback="—"><em class="tag-badge">#{item().tags?.[0]}</em></Show></span>
                    <span class="parent-cell">{row().parentTitle ?? "—"}</span>
                    <span class={{ "money-positive": item().type === "Payment" }}>{formatMoney(item().amount)}</span>
                  </div>
                );
              }}
            </For>
            <Show when={rows().length === 0}>
              <div class="empty-items"><Icon name="search" size={26}/><strong>No matching items</strong><span>Try changing your search or filters.</span></div>
            </Show>
          </div>
        </div>

        <footer class="table-footer">
          <span>{rows().filter(row => row.depth === 0).length} items</span>
        </footer>
      </section>
    </section>
  );
}
