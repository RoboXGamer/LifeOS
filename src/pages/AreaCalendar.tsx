import { createSignal, For, Show } from "solid-js";
import { Link, useParams } from "@tanstack/solid-router";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { createQuery } from "../convex";
import { Icon } from "../Icon";
import {
  compactDateLabel,
  localDateKey,
  monthRange,
} from "../features/items/dates";
import { useItems } from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import { itemIcon } from "../features/items/types";
import "./Retrieval.css";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AreaCalendar() {
  const params = useParams({ from: "/app/areas/$areaId/calendar" });
  const items = useItems();
  const panel = useItemPanelRoute();
  const areaId = () => params().areaId as Id<"areas">;
  const area = () => items.areas().find((entry) => entry._id === areaId());
  const [month, setMonth] = createSignal(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = createSignal(localDateKey());
  const range = () => monthRange(month());
  const source = createQuery(
    api.items.listAreaRange,
    () => ({
      areaId: areaId(),
      fromDate: range().fromDate,
      toDate: range().toDate,
    }),
    { initialValue: [] },
  );
  const selectedItems = () =>
    (source() ?? []).filter((item) => item.dueDate === selectedDate());
  const monthLabel = () =>
    new Intl.DateTimeFormat(undefined, {
      month: "long",
      year: "numeric",
    }).format(month());
  const calendarDays = () => {
    const first = new Date(month().getFullYear(), month().getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const last = new Date(month().getFullYear(), month().getMonth() + 1, 0);
    return [
      ...Array.from({ length: offset }, (_, index) => ({
        key: `before-${index}`,
        date: "",
        number: 0,
      })),
      ...Array.from({ length: last.getDate() }, (_, index) => {
        const date = new Date(
          month().getFullYear(),
          month().getMonth(),
          index + 1,
        );
        return {
          key: localDateKey(date),
          date: localDateKey(date),
          number: index + 1,
        };
      }),
    ];
  };
  const countFor = (date: string) =>
    (source() ?? []).filter((item) => item.dueDate === date).length;
  const moveMonth = (amount: number) => {
    const next = new Date(
      month().getFullYear(),
      month().getMonth() + amount,
      1,
    );
    setMonth(next);
    setSelectedDate(localDateKey(next));
  };

  return (
    <section class="retrieval-page">
      <header class="retrieval-header">
        <div>
          <span>{area()?.name ?? "Area"}</span>
          <h2>{monthLabel()}</h2>
          <p>Dated Items in this Area, bounded to one month at a time.</p>
        </div>
        <div class="calendar-actions">
          <Link to="/app/areas/$areaId" params={{ areaId: areaId() }}>
            <Icon name="list" size={16} />
            List
          </Link>
          <button type="button" onClick={() => moveMonth(-1)}>
            Previous
          </button>
          <button type="button" onClick={() => moveMonth(1)}>
            Next
          </button>
        </div>
      </header>
      <div class="retrieval-scroll">
        <div class="calendar-grid" aria-label={`${monthLabel()} calendar`}>
          <For each={weekdays}>{(day) => <span class="calendar-weekday">{day}</span>}</For>
          <For each={calendarDays()} keyed={(day) => day.key}>
            {(day) => (
              <button
                type="button"
                class={[
                  "calendar-day",
                  {
                    outside: !day().date,
                    today: day().date === localDateKey(),
                    selected: day().date === selectedDate(),
                  },
                ]}
                disabled={!day().date}
                aria-label={
                  day().date
                    ? `${compactDateLabel(day().date)}, ${countFor(day().date)} items`
                    : "Outside current month"
                }
                onClick={() => day().date && setSelectedDate(day().date)}
              >
                <span>{day().number || ""}</span>
                <Show when={countFor(day().date) > 0}>
                  <small>{countFor(day().date)} items</small>
                </Show>
              </button>
            )}
          </For>
        </div>
        <section class="retrieval-section">
          <header>
            <h3>{compactDateLabel(selectedDate())}</h3>
            <button
              type="button"
              class="primary-action"
              onClick={() =>
                panel.createItem({
                  area: areaId(),
                  date: selectedDate(),
                })
              }
            >
              Add on this date
            </button>
          </header>
          <Show
            when={selectedItems().length > 0}
            fallback={
              <div class="retrieval-empty">
                <p>No dated Items on this day.</p>
              </div>
            }
          >
            <For each={selectedItems()} keyed={(item) => item._id}>
              {(item) => (
                <article class="retrieval-row">
                  <span class="retrieval-icon">
                    <Icon name={itemIcon(item().type)} size={18} />
                  </span>
                  <button
                    type="button"
                    class="retrieval-main"
                    onClick={() => panel.openItem(item()._id)}
                  >
                    <strong>{item().title}</strong>
                    <span>{item().type ?? "Unsorted"}</span>
                  </button>
                  <span class="retrieval-badge">
                    {item().status ?? item().type ?? "Item"}
                  </span>
                </article>
              )}
            </For>
          </Show>
        </section>
      </div>
    </section>
  );
}
