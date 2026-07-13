import { For, Show, createEffect, createSignal } from "solid-js";
import type { Area, Item, ItemFormValue, ItemPanelMode, ItemStatus, ItemType } from "../types";
import { itemTypeIcon } from "./AreaWorkspace";
import { Icon } from "./Icon";

const formatTimestamp = (value: string) => new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
}).format(new Date(value));

export function ItemInspector(props: {
  mode: ItemPanelMode;
  item: Item | null;
  areas: Area[];
  children: Item[];
  possibleParents: Item[];
  initialAreaId: string | null;
  initialParentId: string | null;
  onClose: () => void;
  onModeChange: (mode: ItemPanelMode) => void;
  onSave: (value: ItemFormValue) => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onOpenItem: (id: string) => void;
  onAddChild: () => void;
}) {
  const [selectedType, setSelectedType] = createSignal<ItemType>("Task");
  createEffect(
    () => [props.mode, props.item?.id, props.item?.type] as const,
    ([mode, , type]) => {
      if (mode === "edit" || mode === "create") setSelectedType(type ?? "Task");
    }
  );
  const area = () => props.areas.find(area => area.id === props.item?.areaId);
  const parent = () => props.possibleParents.find(item => item.id === props.item?.parentId);
  const editing = () => props.mode === "edit" || props.mode === "create";

  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const title = data.get("title")?.toString().trim() ?? "";
    if (!title) return;
    const type = data.get("type") as ItemType;
    const priority = data.get("priority")?.toString();
    const amount = data.get("amount")?.toString();
    props.onSave({
      title,
      type,
      areaId: data.get("areaId")?.toString() || null,
      parentId: data.get("parentId")?.toString() || null,
      status: type === "Task" ? data.get("status") as ItemStatus : undefined,
      priority: priority ? Number(priority) as 1 | 2 | 3 : undefined,
      dueDate: data.get("dueDate")?.toString() || undefined,
      amount: amount ? Number(amount) : undefined,
      isSettled: type === "Expense" || type === "Payment" ? data.get("isSettled") === "on" : undefined,
      tags: (data.get("tags")?.toString() ?? "").split(",").map(tag => tag.trim().replace(/^#/, "")).filter(Boolean),
      description: data.get("description")?.toString().trim() || undefined
    });
  };

  return (
    <aside class="item-inspector universal-item-panel">
      <header class="inspector-header">
        <span class="inspector-type-icon"><Icon name={itemTypeIcon(props.item?.type ?? selectedType())} size={20}/></span>
        <div>
          <Show when={props.item && !editing()}><button class={{ active: !!props.item?.favorite }} aria-label="Favorite item" onClick={props.onToggleFavorite}><Icon name="star" size={19}/></button></Show>
          <button aria-label="Close item panel" onClick={props.onClose}><Icon name="close" size={19}/></button>
        </div>
      </header>

      <Show when={editing()} fallback={
        <>
          <div class="inspector-scroll">
            <h2>{props.item?.title}</h2>
            <dl class="property-list">
              <div><dt><Icon name="inbox" size={16}/> Type</dt><dd>{props.item?.type ?? "Unsorted"}</dd></div>
              <div><dt><Icon name="graduation" size={16}/> Area</dt><dd>{area()?.name ?? "Inbox"}</dd></div>
              <Show when={props.item?.type === "Task"}><div><dt><Icon name="list" size={16}/> Status</dt><dd><em class={`badge status-${props.item?.status?.toLowerCase().replace(" ", "-")}`}>{props.item?.status ?? "Todo"}</em></dd></div></Show>
              <Show when={props.item?.priority}><div><dt><Icon name="flag" size={16}/> Priority</dt><dd><em class={`priority-ring priority-${props.item?.priority}`}>P{props.item?.priority}</em></dd></div></Show>
              <Show when={props.item?.dueDate}><div><dt><Icon name="calendar" size={16}/> Due Date</dt><dd><strong>{props.item?.dueLabel ?? props.item?.dueDate}</strong></dd></div></Show>
              <Show when={props.item?.amount !== undefined}><div><dt><Icon name="currency" size={16}/> Amount</dt><dd><strong>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(props.item!.amount!)}</strong><small>{props.item?.isSettled ? "Settled" : "Unsettled"}</small></dd></div></Show>
            </dl>
            <Show when={props.item?.description}><section class="inspector-section"><h3><Icon name="flag" size={16}/> Description</h3><p>{props.item?.description}</p></section></Show>
            <section class="inspector-section compact-properties">
              <div><span><Icon name="tag" size={16}/> Tags</span><span>{props.item?.tags?.length ? props.item?.tags?.map(tag => `#${tag}`).join(" ") : "—"}</span></div>
              <div><span><Icon name="archive" size={16}/> Parent</span><span>{parent()?.title ?? "—"}</span></div>
              <div class="children-block"><span><Icon name="grid" size={16}/> Child Items</span><span class="count-badge">{props.children.length}</span><Show when={!props.item?.parentId && props.mode !== "archived"}><button class="mini-add" aria-label="Add child item" onClick={props.onAddChild}><Icon name="plus" size={14}/></button></Show></div>
              <For each={props.children}>{child => <button class="child-item-link" onClick={() => props.onOpenItem(child.id)}><Icon name={itemTypeIcon(child.type)} size={14}/><span>{child.title}</span><Icon name="chevronRight" size={14}/></button>}</For>
              <Show when={props.item}><div><span><Icon name="clock" size={16}/> Created</span><span>{formatTimestamp(props.item!.createdAt)}</span></div><div><span><Icon name="clock" size={16}/> Updated</span><span>{formatTimestamp(props.item!.updatedAt)}</span></div></Show>
            </section>
            <Show when={props.mode !== "archived"}><section class="archive-section"><div><strong>Archive</strong><span>Remove from active views.</span></div><button class="switch" aria-label="Archive item" onClick={props.onArchive}><i/></button></section></Show>
          </div>
          <footer class="inspector-actions">
            <Show when={props.mode === "archived"} fallback={<><button class="delete-action" onClick={props.onDelete}><Icon name="trash" size={18}/> Delete</button><button class="edit-action" onClick={() => props.onModeChange("edit")}><Icon name="edit" size={18}/> Edit</button></>}>
              <button class="delete-action" onClick={props.onDelete}><Icon name="trash" size={18}/> Delete</button><button class="edit-action" onClick={props.onRestore}><Icon name="archive" size={18}/> Restore</button>
            </Show>
          </footer>
        </>
      }>
        <form class="inspector-form" onSubmit={submit}>
          <div class="inspector-scroll">
            <h2>{props.mode === "create" ? (props.initialParentId ? "New child item" : "New item") : "Edit item"}</h2>
            <label><span>Title</span><input name="title" value={props.item?.title ?? ""} autofocus autocomplete="off" placeholder="What needs your attention?" required/></label>
            <label><span>Type</span><select name="type" value={selectedType()} onChange={event => setSelectedType(event.currentTarget.value as ItemType)}><For each={["Task", "Note", "Event", "Expense", "Payment"] as ItemType[]}>{type => <option value={type}>{type}</option>}</For></select></label>
            <label><span>Area</span><select name="areaId" value={props.item?.areaId ?? props.initialAreaId ?? ""}><option value="">Inbox</option><For each={props.areas}>{area => <option value={area.id}>{area.name}</option>}</For></select></label>
            <Show when={selectedType() === "Task"}><label><span>Status</span><select name="status" value={props.item?.status ?? "Todo"}><option>Todo</option><option>In Progress</option><option>Done</option></select></label></Show>
            <label><span>Priority</span><select name="priority" value={props.item?.priority?.toString() ?? ""}><option value="">None</option><option value="1">P1 · High</option><option value="2">P2 · Medium</option><option value="3">P3 · Low</option></select></label>
            <label><span>Due date</span><input name="dueDate" type="date" value={props.item?.dueDate ?? ""}/></label>
            <Show when={selectedType() === "Expense" || selectedType() === "Payment"}><label><span>Amount</span><input name="amount" type="number" min="0" step="0.01" value={props.item?.amount?.toString() ?? ""}/></label><label class="check-field"><input name="isSettled" type="checkbox" checked={props.item?.isSettled ?? selectedType() === "Payment"}/><span>Settled</span></label></Show>
            <label><span>Parent item</span><select name="parentId" value={props.item?.parentId ?? props.initialParentId ?? ""}><option value="">None</option><For each={props.possibleParents}>{item => <option value={item.id}>{item.title}</option>}</For></select></label>
            <label><span>Tags</span><input name="tags" value={(props.item?.tags ?? []).join(", ")} placeholder="urgent, college"/></label>
            <label><span>Description</span><textarea name="description" rows="5" placeholder="Add useful context...">{props.item?.description ?? ""}</textarea></label>
          </div>
          <footer class="inspector-actions"><button type="button" class="delete-action" onClick={() => props.item ? props.onModeChange(props.item.archived ? "archived" : "view") : props.onClose()}>Cancel</button><button class="edit-action" type="submit">{props.mode === "create" ? "Create Item" : "Save Changes"}</button></footer>
        </form>
      </Show>
    </aside>
  );
}
