import { For, Show, createSignal } from "solid-js";
import type { Area, Item, ItemType } from "../types";
import { itemTypeIcon } from "./AreaWorkspace";
import { Icon } from "./Icon";
import "./V1Screens.css";

const formatDate = (value?: string) => value
  ? new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${value}T00:00:00`))
  : "No date";

function ScreenHeader(props: { eyebrow?: string; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <header class="screen-header">
      <div><Show when={props.eyebrow}><span>{props.eyebrow}</span></Show><h1>{props.title}</h1><p>{props.description}</p></div>
      <Show when={props.actionLabel && props.onAction}><button class="screen-primary" onClick={props.onAction}><Icon name="plus" size={18}/>{props.actionLabel}</button></Show>
    </header>
  );
}

function ScreenItemRow(props: {
  item: Item;
  area?: Area;
  onEdit: () => void;
  onToggle: () => void;
  trailing?: unknown;
  canToggle?: boolean;
  toggleLabel?: string;
}) {
  return (
    <article class="screen-item-row">
      <button class={["screen-check", { checked: props.item.status === "Done" }]} disabled={props.canToggle === false || (props.canToggle === undefined && props.item.type !== "Task")} aria-label={`${props.toggleLabel ?? "Complete"} ${props.item.title}`} onClick={props.onToggle}>
        <Show when={props.item.status === "Done"}>✓</Show>
      </button>
      <span class={`screen-item-icon item-${props.item.color}`}><Icon name={itemTypeIcon(props.item.type)} size={19}/></span>
      <button class="screen-item-copy" onClick={props.onEdit}>
        <strong>{props.item.title}</strong>
        <span><em>{props.item.type ?? "Unsorted"}</em><Show when={props.area}> · {props.area?.name}</Show><Show when={props.item.dueDate}> · {formatDate(props.item.dueDate)}</Show></span>
      </button>
      <div class="screen-item-tags"><For each={props.item.tags ?? []}>{tag => <span>#{tag}</span>}</For></div>
      {props.trailing}
      <button class="screen-edit" aria-label={`Edit ${props.item.title}`} onClick={props.onEdit}><Icon name="edit" size={17}/></button>
    </article>
  );
}

export function InboxWorkspace(props: {
  items: () => Item[];
  areas: () => Area[];
  onCapture: () => void;
  onEdit: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <section class="v1-screen">
      <ScreenHeader eyebrow="Capture first" title="Inbox" description="Everything starts here. Add context now or organize it later." actionLabel="Quick Capture" onAction={props.onCapture}/>
      <div class="inbox-overview">
        <span><strong>{props.items().length}</strong><small>Unprocessed</small></span>
        <span><strong>{props.items().filter(item => item.type === "Task").length}</strong><small>Tasks</small></span>
        <span><strong>{props.items().filter(item => item.priority === 1).length}</strong><small>High priority</small></span>
      </div>
      <div class="triage-head"><span>Item</span><span>Type</span><span>Area</span><span>Due date</span><span/></div>
      <div class="triage-list">
        <For each={props.items()} keyed={item => item.id}>
          {item => (
            <article class="triage-row">
              <div><span class={`screen-item-icon item-${item().color}`}><Icon name={itemTypeIcon(item().type)} size={19}/></span><button onClick={() => props.onEdit(item().id)}><strong>{item().title}</strong><small>{(item().tags ?? []).map(tag => `#${tag}`).join("  ") || "Captured item"}</small></button></div>
              <span class={`badge type-${(item().type ?? "Task").toLowerCase()}`}>{item().type ?? "Unsorted"}</span>
              <span class="inbox-destination">Inbox</span>
              <span>{formatDate(item().dueDate)}</span>
              <button class="organize-item" aria-label={`Organize ${item().title}`} onClick={() => props.onEdit(item().id)}><Icon name="edit" size={17}/> Organize</button>
            </article>
          )}
        </For>
        <Show when={props.items().length === 0}><EmptyState icon="inbox" title="Inbox zero" copy="Everything has been organized. Capture something whenever it appears." action="Capture an item" onAction={props.onCapture}/></Show>
      </div>
    </section>
  );
}

export function TodayWorkspace(props: { items: () => Item[]; areas: () => Area[]; onEdit: (id: string) => void; onToggle: (id: string) => void; onCapture: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const dueToday = () => props.items().filter(item => !item.archived && item.type === "Task" && item.dueDate === today);
  const areaFor = (id: string | null) => props.areas().find(area => area.id === id);
  const done = () => dueToday().filter(item => item.status === "Done").length;
  return (
    <section class="v1-screen">
      <ScreenHeader eyebrow={formatDate(today)} title="Today" description="A focused view of what needs your attention now." actionLabel="Add Item" onAction={props.onCapture}/>
      <div class="focus-progress"><div><strong>{done()} of {dueToday().length}</strong><span>completed today</span></div><i><b style={{ width: `${dueToday().length ? done() / dueToday().length * 100 : 0}%` }}/></i></div>
      <div class="screen-list"><For each={dueToday()} keyed={item => item.id}>{item => <ScreenItemRow item={item()} area={areaFor(item().areaId)} onEdit={() => props.onEdit(item().id)} onToggle={() => props.onToggle(item().id)}/>}</For><Show when={!dueToday().length}><EmptyState icon="checkSquare" title="Nothing due today" copy="Enjoy the space, or capture the next thing on your mind." action="Add an item" onAction={props.onCapture}/></Show></div>
    </section>
  );
}

export function UpcomingWorkspace(props: { items: () => Item[]; areas: () => Area[]; onEdit: (id: string) => void; onToggle: (id: string) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = () => props.items().filter(item => !item.archived && item.dueDate && item.dueDate > today).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const areaFor = (id: string | null) => props.areas().find(area => area.id === id);
  return <section class="v1-screen"><ScreenHeader eyebrow="Plan ahead" title="Upcoming" description="Future deadlines and events, ordered by date."/><div class="screen-list"><For each={upcoming()} keyed={item => item.id}>{item => <ScreenItemRow item={item()} area={areaFor(item().areaId)} onEdit={() => props.onEdit(item().id)} onToggle={() => props.onToggle(item().id)} trailing={<time>{formatDate(item().dueDate)}</time>}/>}</For><Show when={!upcoming().length}><EmptyState icon="calendar" title="The horizon is clear" copy="Future deadlines and events will appear here."/></Show></div></section>;
}

export function SearchWorkspace(props: { items: () => Item[]; areas: () => Area[]; onEdit: (id: string) => void; onToggle: (id: string) => void }) {
  const [query, setQuery] = createSignal("");
  const [type, setType] = createSignal<ItemType | "All">("All");
  const results = () => {
    const q = query().trim().toLowerCase();
    return props.items().filter(item => !item.archived && (type() === "All" || item.type === type()) && (!q || `${item.title} ${item.description ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase().includes(q)));
  };
  const areaFor = (id: string | null) => props.areas().find(area => area.id === id);
  return <section class="v1-screen"><ScreenHeader eyebrow="Everything, instantly" title="Search" description="Find items across every Area, type, description, and tag."/><div class="global-search"><Icon name="search" size={21}/><input autofocus placeholder="Search your Life OS..." value={query()} onInput={event => setQuery(event.currentTarget.value)}/><select value={type()} onChange={event => setType(event.currentTarget.value as ItemType | "All")}><option>All</option><For each={["Task", "Note", "Event", "Expense", "Payment"]}>{value => <option>{value}</option>}</For></select></div><p class="result-count">{results().length} results</p><div class="screen-list"><For each={results()} keyed={item => item.id}>{item => <ScreenItemRow item={item()} area={areaFor(item().areaId)} onEdit={() => props.onEdit(item().id)} onToggle={() => props.onToggle(item().id)}/>}</For><Show when={!results().length}><EmptyState icon="search" title="No results" copy="Try a title, description, tag, or another type."/></Show></div></section>;
}

export function TagsWorkspace(props: { items: () => Item[]; areas: () => Area[]; onEdit: (id: string) => void; onToggle: (id: string) => void }) {
  const tags = () => [...new Set(props.items().flatMap(item => item.tags ?? []))].sort();
  const [selectedTag, setSelectedTag] = createSignal<string | null>(null);
  const taggedItems = () => selectedTag() ? props.items().filter(item => !item.archived && item.tags?.includes(selectedTag()!)) : [];
  const areaFor = (id: string | null) => props.areas().find(area => area.id === id);
  return <section class="v1-screen"><ScreenHeader eyebrow="Flexible organization" title="Tags" description="Browse the labels that cut across Areas and item types."/><div class="tag-grid"><For each={tags()}>{tag => <button class={{ active: selectedTag() === tag }} onClick={() => setSelectedTag(current => current === tag ? null : tag)}><span>#{tag}</span><strong>{props.items().filter(item => item.tags?.includes(tag)).length}</strong></button>}</For></div><Show when={selectedTag()} fallback={<EmptyState icon="tag" title="Choose a tag" copy="Select a label above to see everything connected to it."/>}><div class="tag-result-heading"><strong>#{selectedTag()}</strong><span>{taggedItems().length} items</span></div><div class="screen-list"><For each={taggedItems()} keyed={item => item.id}>{item => <ScreenItemRow item={item()} area={areaFor(item().areaId)} onEdit={() => props.onEdit(item().id)} onToggle={() => props.onToggle(item().id)}/>}</For></div></Show></section>;
}

export function ArchiveWorkspace(props: { items: () => Item[]; areas: () => Area[]; onOpen: (id: string) => void; onRestore: (id: string) => void; onDelete: (id: string) => void }) {
  const archived = () => props.items().filter(item => item.archived);
  const areaFor = (id: string | null) => props.areas().find(area => area.id === id);
  return <section class="v1-screen"><ScreenHeader eyebrow="Out of sight, never lost" title="Archive" description="Finished and inactive items stay available without cluttering active views."/><div class="screen-list"><For each={archived()} keyed={item => item.id}>{item => <ScreenItemRow item={item()} area={areaFor(item().areaId)} onEdit={() => props.onOpen(item().id)} onToggle={() => props.onRestore(item().id)} canToggle toggleLabel="Restore" trailing={<div class="archive-actions"><button onClick={() => props.onRestore(item().id)}><Icon name="archive" size={16}/> Restore</button><button class="danger" onClick={() => props.onDelete(item().id)}><Icon name="trash" size={16}/> Delete</button></div>}/>}</For><Show when={!archived().length}><EmptyState icon="archive" title="Archive is empty" copy="Archived items will be kept safely here."/></Show></div></section>;
}

export function SettingsWorkspace(props: { itemCount: number; areaCount: number; onReset: () => void; onArchiveCompleted: () => void }) {
  return <section class="v1-screen"><ScreenHeader eyebrow="Life OS V1" title="Settings" description="Manage local data and keep the system intentionally simple."/><div class="settings-grid"><section><span class="settings-icon"><Icon name="archive" size={22}/></span><div><h2>Archive completed tasks</h2><p>Move every completed task out of active views.</p></div><button onClick={props.onArchiveCompleted}>Archive completed</button></section><section><span class="settings-icon"><Icon name="grid" size={22}/></span><div><h2>Your local workspace</h2><p>{props.areaCount} Areas and {props.itemCount} Items are stored on this device.</p></div><em>Auto-saved</em></section><section class="danger-setting"><span class="settings-icon"><Icon name="trash" size={22}/></span><div><h2>Reset sample data</h2><p>Replace local changes with the original Life OS demonstration data.</p></div><button onClick={props.onReset}>Reset data</button></section></div><div class="scope-note"><Icon name="sparkle" size={22}/><div><strong>Focused V1</strong><p>One workspace, five Item types, single-level child items, Inbox, Today, Upcoming, Search, Areas, Tags, and Archive. Advanced analytics, AI, collaboration, recurring tasks, and automations remain intentionally outside V1.</p></div></div></section>;
}

function EmptyState(props: { icon: Parameters<typeof Icon>[0]["name"]; title: string; copy: string; action?: string; onAction?: () => void }) {
  return <div class="screen-empty"><span><Icon name={props.icon} size={27}/></span><strong>{props.title}</strong><p>{props.copy}</p><Show when={props.action && props.onAction}><button onClick={props.onAction}>{props.action}</button></Show></div>;
}
