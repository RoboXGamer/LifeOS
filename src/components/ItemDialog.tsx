import { Show, createEffect, createSignal } from "solid-js";
import type { Item, ItemStatus, ItemType } from "../types";
import { Icon } from "./Icon";

export type ItemFormValue = {
  title: string;
  type: ItemType;
  status?: ItemStatus;
  priority?: 1 | 2 | 3;
  dueDate?: string;
  tags: string[];
  description?: string;
  amount?: number;
};

export function ItemDialog(props: {
  open: () => boolean;
  item: () => Item | null;
  onClose: () => void;
  onSave: (value: ItemFormValue) => void;
}) {
  const [selectedType, setSelectedType] = createSignal<ItemType>("Task");
  createEffect(
    () => [props.open(), props.item()?.id, props.item()?.type] as const,
    ([open, , type]) => { if (open) setSelectedType(type ?? "Task"); }
  );
  const submit = (event: Event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    const title = data.get("title")?.toString().trim() ?? "";
    if (!title) return;
    const type = data.get("type") as ItemType;
    const priorityValue = data.get("priority")?.toString();
    const amountValue = data.get("amount")?.toString();
    props.onSave({
      title,
      type,
      status: type === "Task" ? data.get("status") as ItemStatus : undefined,
      priority: priorityValue ? Number(priorityValue) as 1 | 2 | 3 : undefined,
      dueDate: data.get("dueDate")?.toString() || undefined,
      tags: (data.get("tags")?.toString() ?? "").split(",").map(tag => tag.trim().replace(/^#/, "")).filter(Boolean),
      description: data.get("description")?.toString().trim() || undefined,
      amount: amountValue ? Number(amountValue) : undefined
    });
    props.onClose();
  };

  return (
    <Show when={props.open()}>
      <div class="dialog-backdrop" onMouseDown={event => event.target === event.currentTarget && props.onClose()}>
        <section class="item-dialog" role="dialog" aria-modal="true" aria-labelledby="item-dialog-title">
          <header><div><span><Icon name={props.item() ? "edit" : "plus"} size={20}/></span><div><h2 id="item-dialog-title">{props.item() ? "Edit Item" : "New Item"}</h2><p>{props.item() ? "Update this item’s details." : "Add something to this Area."}</p></div></div><button aria-label="Close" onClick={props.onClose}><Icon name="close" size={20}/></button></header>
          <form onSubmit={submit}>
            <label class="full-field"><span>Title</span><input name="title" value={props.item()?.title ?? ""} autofocus autocomplete="off" placeholder="What needs your attention?"/></label>
            <div class="field-grid">
              <label><span>Type</span><select name="type" value={selectedType()} onChange={event => setSelectedType(event.currentTarget.value as ItemType)}><ForOptions values={["Task", "Note", "Event", "Expense", "Payment"]} selected={props.item()?.type ?? "Task"}/></select></label>
              <Show when={selectedType() === "Task"}><label><span>Status</span><select name="status"><ForOptions values={["Todo", "In Progress", "Done"]} selected={props.item()?.status ?? "Todo"}/></select></label></Show>
              <label><span>Priority</span><select name="priority"><option value="">None</option><ForOptions values={["1", "2", "3"]} selected={props.item()?.priority?.toString() ?? ""}/></select></label>
              <label><span>Due date</span><input name="dueDate" type="date" value={props.item()?.dueDate ?? ""}/></label>
              <label><span>Tags</span><input name="tags" value={(props.item()?.tags ?? []).join(", ")} placeholder="urgent, college"/></label>
              <Show when={selectedType() === "Expense" || selectedType() === "Payment"}><label><span>Amount</span><input name="amount" type="number" min="0" value={props.item()?.amount?.toString() ?? ""} placeholder="0.00"/></label></Show>
            </div>
            <label class="full-field"><span>Description</span><textarea name="description" rows="4" placeholder="Add useful context...">{props.item()?.description ?? ""}</textarea></label>
            <footer><button type="button" onClick={props.onClose}>Cancel</button><button class="save-item" type="submit">{props.item() ? "Save Changes" : "Create Item"}</button></footer>
          </form>
        </section>
      </div>
    </Show>
  );
}

function ForOptions(props: { values: string[]; selected: string }) {
  return <>{props.values.map(value => <option value={value} selected={value === props.selected}>{value}</option>)}</>;
}
