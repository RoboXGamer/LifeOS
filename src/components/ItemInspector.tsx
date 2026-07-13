import { Show } from "solid-js";
import type { Area, Item } from "../types";
import { itemTypeIcon } from "./AreaWorkspace";
import { Icon } from "./Icon";

const formatTimestamp = (value: string) => new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
}).format(new Date(value));

export function ItemInspector(props: {
  item: Item;
  area: Area;
  childCount: number;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onOpenChildren: () => void;
}) {
  return (
    <aside class="item-inspector">
      <header class="inspector-header">
        <span class="inspector-type-icon"><Icon name={itemTypeIcon(props.item.type)} size={20}/></span>
        <div><button class={{ active: !!props.item.favorite }} aria-label="Favorite item" onClick={props.onToggleFavorite}><Icon name="star" size={19}/></button><button aria-label="Close inspector" onClick={props.onClose}><Icon name="close" size={19}/></button></div>
      </header>
      <div class="inspector-scroll">
        <h2>{props.item.title}</h2>
        <dl class="property-list">
          <div><dt><Icon name="inbox" size={16}/> Type</dt><dd>{props.item.type}</dd></div>
          <div><dt><Icon name="graduation" size={16}/> Area</dt><dd>{props.area.name}</dd></div>
          <Show when={props.item.type === "Task"}>
            <div><dt><Icon name="list" size={16}/> Status</dt><dd><em class={`badge status-${props.item.status?.toLowerCase().replace(" ", "-")}`}>{props.item.status}</em></dd></div>
            <Show when={props.item.priority}>
              <div><dt><Icon name="flag" size={16}/> Priority</dt><dd><em class={`priority-ring priority-${props.item.priority}`}>P{props.item.priority}</em> <span class="priority-label">P{props.item.priority} ({props.item.priority === 1 ? "High" : props.item.priority === 2 ? "Medium" : "Low"})</span></dd></div>
            </Show>
          </Show>
          <Show when={props.item.dueDate}>
            <div><dt><Icon name="calendar" size={16}/> Due Date</dt><dd><strong>{props.item.dueLabel ?? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${props.item.dueDate}T00:00:00`))}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${props.item.dueDate}T00:00:00`))}</small></dd></div>
          </Show>
          <Show when={props.item.amount !== undefined}>
            <div><dt><Icon name="currency" size={16}/> Amount</dt><dd><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(props.item.amount!)}</strong><small>{props.item.isSettled ? "Settled" : "Unsettled"}</small></dd></div>
          </Show>
        </dl>

        <Show when={props.item.description}>
          <section class="inspector-section">
            <h3><Icon name="flag" size={16}/> Description</h3>
            <p>{props.item.description}</p>
          </section>
        </Show>

        <section class="inspector-section compact-properties">
          <div><span><Icon name="tag" size={16}/> Tags</span><span class="tag-badge">#{props.item.tags?.[0] ?? "none"}</span><button class="mini-add" aria-label="Add tag" onClick={props.onEdit}><Icon name="plus" size={14}/></button></div>
          <div><span><Icon name="archive" size={16}/> Parent</span><span>—</span></div>
          <button class="child-property" disabled={props.childCount === 0} onClick={props.onOpenChildren}><span><Icon name="grid" size={16}/> Child Items</span><span class="count-badge">{props.childCount}</span><Icon name="chevronRight" size={16}/></button>
          <div><span><Icon name="clock" size={16}/> Created At</span><span>{formatTimestamp(props.item.createdAt)}</span></div>
          <div><span><Icon name="clock" size={16}/> Updated At</span><span>{formatTimestamp(props.item.updatedAt)}</span></div>
        </section>

        <section class="archive-section">
          <div><strong>Archive</strong><span>Move this item to archive.</span></div>
          <button class={["switch", { active: !!props.item.archived }]} aria-label="Archive item" onClick={props.onArchive}><i/></button>
        </section>
      </div>
      <footer class="inspector-actions">
        <button class="delete-action" onClick={props.onDelete}><Icon name="trash" size={18}/> Delete</button>
        <button class="edit-action" onClick={props.onEdit}><Icon name="edit" size={18}/> Edit</button>
      </footer>
    </aside>
  );
}
