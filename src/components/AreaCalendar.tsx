import { For, Show, createSignal } from "solid-js";
import type { Area, Item, ItemType } from "../types";
import { itemTypeIcon } from "./AreaWorkspace";
import { Icon } from "./Icon";
import "./AreaCalendar.css";

const pad = (value: number) => String(value).padStart(2, "0");
const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const fromIsoDate = (value: string) => new Date(`${value}T12:00:00`);
const addDays = (date: Date, amount: number) => { const next = new Date(date); next.setDate(next.getDate() + amount); return next; };
const mondayOf = (date: Date) => { const next = new Date(date); const day = next.getDay() || 7; next.setDate(next.getDate() - day + 1); next.setHours(12, 0, 0, 0); return next; };
const longDate = (value: string) => new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(fromIsoDate(value));
const shortDate = (date: Date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);

export function AreaCalendar(props: {
  area: Area;
  items: () => Item[];
  onBack: () => void;
  onListView: () => void;
  onNewItem: (dueDate?: string) => void;
  onSelectItem: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  const today = toIsoDate(new Date());
  const initialDate = (() => {
    const dated = props.items().filter(item => !item.archived && item.dueDate).map(item => item.dueDate!);
    const thisWeekStart = toIsoDate(mondayOf(new Date()));
    const thisWeekEnd = toIsoDate(addDays(mondayOf(new Date()), 6));
    if (dated.some(date => date >= thisWeekStart && date <= thisWeekEnd)) return today;
    return dated.sort((a, b) => Math.abs(fromIsoDate(a).getTime() - Date.now()) - Math.abs(fromIsoDate(b).getTime() - Date.now()))[0] ?? today;
  })();
  const [focusDate, setFocusDate] = createSignal(fromIsoDate(initialDate));
  const [selectedDate, setSelectedDate] = createSignal(initialDate);
  const [mode, setMode] = createSignal<"week" | "agenda">("week");
  const [query, setQuery] = createSignal("");

  const weekStart = () => mondayOf(focusDate());
  const weekDays = () => Array.from({ length: 7 }, (_, index) => addDays(weekStart(), index));
  const datedItems = () => {
    const term = query().trim().toLowerCase();
    return props.items().filter(item => !item.archived && item.dueDate && (!term || `${item.title} ${(item.tags ?? []).join(" ")} ${item.type}`.toLowerCase().includes(term)));
  };
  const itemsForDate = (date: string) => datedItems().filter(item => item.dueDate === date).sort((a, b) => (a.priority ?? 4) - (b.priority ?? 4) || a.title.localeCompare(b.title));
  const currentWeekItems = () => { const start = toIsoDate(weekStart()); const end = toIsoDate(addDays(weekStart(), 6)); return datedItems().filter(item => item.dueDate! >= start && item.dueDate! <= end); };
  const agendaDates = () => [...new Set(datedItems().map(item => item.dueDate!))].sort();
  const selectedItems = () => itemsForDate(selectedDate());
  const overdueItems = () => datedItems().filter(item => item.dueDate! < today && item.type === "Task" && item.status !== "Done").sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const countType = (type: ItemType) => currentWeekItems().filter(item => item.type === type).length;

  const moveWeek = (amount: number) => {
    const next = addDays(focusDate(), amount * 7);
    setFocusDate(next);
    setSelectedDate(toIsoDate(mondayOf(next)));
  };
  const goToday = () => { const now = new Date(); setFocusDate(now); setSelectedDate(today); };
  const selectDay = (date: Date) => { setFocusDate(date); setSelectedDate(toIsoDate(date)); };

  const CalendarItem = (item: Item, compact = false) => <button class={["calendar-item", `calendar-${item.type.toLowerCase()}`, { completed: item.status === "Done", compact }]} onClick={() => props.onSelectItem(item.id)}>
    <Show when={item.type === "Task"} fallback={<Icon name={itemTypeIcon(item.type)} size={14}/>}><span class={[
      "calendar-check", { checked: item.status === "Done" }
    ]} onClick={event => { event.stopPropagation(); props.onToggleComplete(item.id); }}>{item.status === "Done" ? "✓" : ""}</span></Show>
    <span><strong>{item.title}</strong><Show when={!compact}><small>{item.type}<Show when={item.priority}> · P{item.priority}</Show></small></Show></span>
  </button>;

  return <section class={`calendar-workspace tone-${props.area.tone}`}>
    <div class="calendar-main">
      <header class="calendar-topbar">
        <button class="breadcrumb" onClick={props.onBack}><span>Areas</span><Icon name="chevronRight" size={14}/><span>{props.area.name}</span><Icon name="chevronRight" size={14}/><strong>Calendar</strong></button>
        <div><button onClick={props.onListView}><Icon name="list" size={17}/> List View</button><button class="primary-action" onClick={() => props.onNewItem(selectedDate() || undefined)}><Icon name="plus" size={18}/> New Item</button></div>
      </header>

      <div class="calendar-heading"><h1>{props.area.name} Calendar</h1><p>Your dated tasks, events, notes, expenses, and payments at a glance.</p></div>

      <div class="calendar-toolbar">
        <div class="week-navigation"><button aria-label="Previous week" onClick={() => moveWeek(-1)}><Icon name="chevronRight" class="rotate-180" size={17}/></button><button aria-label="Next week" onClick={() => moveWeek(1)}><Icon name="chevronRight" size={17}/></button><strong>{shortDate(weekStart())} – {shortDate(addDays(weekStart(), 6))}, {weekStart().getFullYear()}</strong><button onClick={goToday}>Today</button></div>
        <label class="calendar-search"><input value={query()} onInput={event => setQuery(event.currentTarget.value)} placeholder="Search this calendar…"/><Icon name="search" size={17}/></label>
        <div class="calendar-mode"><button class={{ active: mode() === "week" }} onClick={() => setMode("week")}>Week</button><button class={{ active: mode() === "agenda" }} onClick={() => setMode("agenda")}>Agenda</button></div>
      </div>

      <div class="calendar-stats">
        <span><Icon name="calendar" size={21}/><strong>{currentWeekItems().length}<small>This week</small></strong></span>
        <span><Icon name="checkSquare" size={21}/><strong>{countType("Task")}<small>Tasks</small></strong></span>
        <span><Icon name="calendar" size={21}/><strong>{countType("Event")}<small>Events</small></strong></span>
        <span><Icon name="expense" size={21}/><strong>{countType("Expense")}<small>Expenses</small></strong></span>
        <span><Icon name="payment" size={21}/><strong>{countType("Payment")}<small>Payments</small></strong></span>
      </div>

      <Show when={mode() === "week"} fallback={
        <div class="calendar-agenda"><For each={agendaDates()}>{date => <section><button class="agenda-date" onClick={() => selectDay(fromIsoDate(date))}><strong>{longDate(date)}</strong><span>{itemsForDate(date).length} items</span></button><div>{itemsForDate(date).map(item => CalendarItem(item))}</div></section>}</For><Show when={!agendaDates().length}><CalendarEmpty/></Show></div>
      }>
        <div class="calendar-week-scroll"><div class="calendar-week">
          {weekDays().map(day => { const date = toIsoDate(day); const entries = () => itemsForDate(date); return <section class={{ selected: selectedDate() === date, today: today === date }} onClick={() => selectDay(day)}><header><span>{new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(day)}</span><strong>{day.getDate()}</strong><small>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(day)}</small></header><div>{entries().map(item => CalendarItem(item))}<Show when={!entries().length}><button class="empty-day-add" onClick={event => { event.stopPropagation(); props.onNewItem(date); }}>+ Add item</button></Show></div></section>; })}
        </div></div>
      </Show>
    </div>

    <aside class="calendar-day-panel">
      <header><div><Icon name="calendar" size={20}/><strong>{selectedDate() ? longDate(selectedDate()) : "Day details"}</strong></div><button aria-label="Close day details" onClick={() => setSelectedDate("")}><Icon name="close" size={18}/></button></header>
      <Show when={selectedDate()} fallback={<div class="day-panel-empty">Select a day to see its items.</div>}>
        <div class="day-panel-summary"><span>{selectedItems().length} items</span><button onClick={() => props.onNewItem(selectedDate())}><Icon name="plus" size={15}/> Add item</button></div>
        <div class="day-items"><Show when={selectedItems().length} fallback={<div class="day-panel-empty"><Icon name="calendar" size={25}/><span>Nothing scheduled.</span><button onClick={() => props.onNewItem(selectedDate())}>Plan this day</button></div>}>{selectedItems().map(item => CalendarItem(item))}</Show></div>
        <Show when={overdueItems().length}><section class="overdue-items"><h3>Overdue <span>{overdueItems().length}</span></h3>{overdueItems().slice(0, 4).map(item => <button onClick={() => props.onSelectItem(item.id)}><time>{shortDate(fromIsoDate(item.dueDate!))}</time><span>{item.title}</span></button>)}</section></Show>
      </Show>
    </aside>
  </section>;
}

function CalendarEmpty() {
  return <div class="calendar-empty"><Icon name="calendar" size={28}/><strong>No dated items found</strong><p>Add due dates to Items or change your search.</p></div>;
}
