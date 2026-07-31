import { createSignal, For, Show } from "solid-js";
import { Link, useParams } from "@tanstack/solid-router";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import { Icon, type IconName } from "../Icon";
import { createMutation, toError } from "../convex";
import {
  useItems,
  type ItemInput,
  type ItemType,
  type ItemView,
} from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import { dueDateLabel, itemIcon } from "../features/items/types";
import { AreaEditor, type AreaInput } from "./Areas";
import "./AreaDetail.css";

const types: Array<ItemType | "All"> = [
  "All",
  "Task",
  "Note",
  "Event",
  "Expense",
  "Payment",
];

const amountFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function AreaDetail() {
  const params = useParams({ from: "/app/areas/$areaId" });
  const items = useItems();
  const panel = useItemPanelRoute();
  const [search, setSearch] = createSignal("");
  const [type, setType] = createSignal<ItemType | "All">("All");
  const [expanded, setExpanded] = createSignal(new Set<string>());
  const [editingArea, setEditingArea] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const updateAreaMutation = createMutation(api.areas.update);
  const areaId = () => params().areaId as Id<"areas">;
  const area = () => items.areas().find((entry) => entry._id === areaId());
  const allAreaItems = () =>
    items.activeItems.filter((item) => item.areaId === areaId());
  const topLevelItems = () => {
    const query = search().trim().toLowerCase();
    return allAreaItems().filter((item) => {
      if (item.parentId !== null) return false;
      const family = [item, ...items.childrenOf(item._id)];
      const matchesType =
        type() === "All" || family.some((entry) => entry.type === type());
      const matchesSearch =
        !query ||
        family.some((entry) =>
          `${entry.title} ${entry.description ?? ""} ${entry.type ?? ""} ${entry.tags.join(" ")}`
            .toLowerCase()
            .includes(query),
        );
      return matchesType && matchesSearch;
    });
  };
  const count = (itemType: ItemType) =>
    allAreaItems().filter((item) => item.type === itemType).length;
  const toggleExpanded = (itemId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };
  const open = (itemId: Id<"items">) => panel.openItem(itemId);
  const toggleTask = (itemId: Id<"items">, done: boolean) =>
    void items.setTaskDone(itemId, done);
  const cyclePriority = (itemId: Id<"items">) => {
    const item = items.itemById(itemId);
    if (!item) return;
    const priority =
      item.priority === 1
        ? 2
        : item.priority === 2
          ? 3
          : item.priority === 3
            ? null
            : 1;
    const input: ItemInput = {
      title: item.title,
      areaId: item.areaId,
      type: item.type ?? null,
      status: item.status ?? null,
      priority,
      dueDate: item.dueDate ?? null,
      amount: item.amount ?? null,
      isSettled: item.isSettled ?? null,
      description: item.description ?? null,
      parentId: item.parentId,
      tags: item.tags,
    };
    void items.updateItem(itemId, input);
  };
  const saveArea = async (input: AreaInput) => {
    try {
      await updateAreaMutation({ areaId: areaId(), ...input });
      setEditingArea(false);
      setError(null);
    } catch (reason) {
      setError(toError(reason).message);
    }
  };
  const row = (
    item: ItemView,
    options: {
      childCount?: number;
      parentTitle?: string;
    } = {},
  ) => {
    const childCount = options.childCount ?? 0;
    const status =
      item.type === "Task"
        ? (item.status ?? "Todo")
        : item.type === "Expense" || item.type === "Payment"
          ? item.isSettled
            ? "Settled"
            : "Open"
          : null;

    return (
      <div
        class={["area-table-row", { "is-child": !!options.parentTitle }]}
        role="button"
        tabindex={0}
        onClick={() => open(item._id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            open(item._id);
          }
        }}
      >
        <div class="area-row-title">
          <Show when={options.parentTitle}>
            <span class="area-child-branch" aria-hidden="true" />
          </Show>
          <Show
            when={childCount > 0}
            fallback={<span class="area-row-expand-spacer" />}
          >
            <button
              class="family-toggle"
              type="button"
              aria-label={`Toggle children for ${item.title}`}
              aria-expanded={expanded().has(item._id) ? "true" : "false"}
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(item._id);
              }}
            >
              <Icon
                name={expanded().has(item._id) ? "chevronDown" : "chevronRight"}
                size={13}
              />
            </button>
          </Show>
          <Show
            when={item.type === "Task"}
            fallback={
              <span class="area-row-icon">
                <Icon name={itemIcon(item.type)} size={14} />
              </span>
            }
          >
            <button
              type="button"
              class={["area-row-check", { checked: item.status === "Done" }]}
              aria-label={
                item.status === "Done"
                  ? "Mark task incomplete"
                  : "Complete task"
              }
              onClick={(event) => {
                event.stopPropagation();
                toggleTask(item._id, item.status !== "Done");
              }}
            >
              <Show when={item.status === "Done"}>✓</Show>
            </button>
          </Show>
          <span class="area-row-title-copy">
            <strong class={{ completed: item.status === "Done" }}>
              {item.title}
            </strong>
            <span class="area-row-mobile-meta">
              {item.type ?? "Item"}
              <Show when={dueDateLabel(item.dueDate)}>
                {(label) => <> · {label()}</>}
              </Show>
            </span>
          </span>
          <Show when={childCount > 0}>
            <small>{childCount}</small>
          </Show>
        </div>
        <span class="area-col-type area-type-badge">{item.type ?? "Item"}</span>
        <span class="area-col-status">
          <Show when={status} fallback={<span class="area-muted">—</span>}>
            {(label) => <span class="area-status-badge">{label()}</span>}
          </Show>
        </span>
        <button
          type="button"
          class={[
            "area-col-priority area-priority-button",
            { active: !!item.priority },
          ]}
          aria-label={`Change priority for ${item.title}`}
          onClick={(event) => {
            event.stopPropagation();
            cyclePriority(item._id);
          }}
        >
          {item.priority ? `P${item.priority}` : "—"}
        </button>
        <span class="area-col-due area-date-cell">
          {dueDateLabel(item.dueDate) ?? "—"}
        </span>
        <span class="area-col-tags area-row-tags">
          <Show
            when={item.tags.length > 0}
            fallback={<span class="area-muted">—</span>}
          >
            <span>{item.tags[0]}</span>
            <Show when={item.tags.length > 1}>
              <small>+{item.tags.length - 1}</small>
            </Show>
          </Show>
        </span>
        <span class="area-col-parent area-parent-cell">
          {options.parentTitle ?? "—"}
        </span>
        <span class="area-col-amount area-amount-cell">
          {item.amount === undefined
            ? "—"
            : amountFormatter.format(item.amount)}
        </span>
      </div>
    );
  };

  return (
    <section class="area-detail-page">
      <Show when={area()} fallback={<AreaUnavailable />}>
        {(currentArea) => (
          <>
            <header class="area-detail-topbar">
              <div class="area-breadcrumb">
                <Link to="/app/areas">Areas</Link>
                <Icon name="chevronRight" size={14} />
                <span>{currentArea().name}</span>
              </div>
              <div class="area-detail-actions">
                <button type="button" onClick={() => setEditingArea(true)}>
                  <Icon name="edit" size={17} /> Edit Area
                </button>
                <Link
                  to="/app/areas/$areaId/calendar"
                  params={{ areaId: areaId() }}
                >
                  <Icon name="calendar" size={17} /> Calendar
                </Link>
                <button
                  type="button"
                  class="primary-action"
                  onClick={() => panel.createItem({ area: areaId() })}
                >
                  <Icon name="plus" size={18} /> New Item
                </button>
              </div>
            </header>

            <Show when={error()}>
              {(message) => <p class="area-detail-error">{message()}</p>}
            </Show>

            <section
              class="area-summary"
              style={{ "--_area-color": currentArea().color }}
            >
              <div class="area-summary-art">
                <i />
                <b />
                <Icon
                  name={currentArea().icon as IconName}
                  size={46}
                  strokeWidth={1.35}
                />
              </div>
              <div class="area-summary-copy">
                <span>Life Area</span>
                <h1>{currentArea().name}</h1>
                <p>
                  {currentArea().description ||
                    "A focused home for everything connected to this part of life."}
                </p>
              </div>
              <div class="area-summary-total">
                <strong>{allAreaItems().length}</strong>
                <span>Total Items</span>
              </div>
            </section>

            <div class="area-metrics">
              <For each={types.slice(1) as ItemType[]}>
                {(itemType) => (
                  <article>
                    <strong>{count(itemType)}</strong>
                    <span>{itemType}s</span>
                  </article>
                )}
              </For>
            </div>

            <div class="area-toolbar">
              <label>
                <Icon name="search" size={17} />
                <input
                  value={search()}
                  placeholder="Search this Area…"
                  onInput={(event) => setSearch(event.currentTarget.value)}
                />
              </label>
              <div class="area-type-tabs">
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
              </div>
            </div>

            <div class="area-table-head">
              <span>Title</span>
              <span class="area-col-type">Type</span>
              <span class="area-col-status">Status</span>
              <span class="area-col-priority">Priority</span>
              <span class="area-col-due">Due date</span>
              <span class="area-col-tags">Tags</span>
              <span class="area-col-parent">Parent</span>
              <span class="area-col-amount">Amount</span>
            </div>
            <Show
              when={topLevelItems().length > 0}
              fallback={
                <AreaEmpty
                  filtered={!!search() || type() !== "All"}
                  onCreate={() => panel.createItem({ area: areaId() })}
                />
              }
            >
              <div class="area-product-list">
                <For each={topLevelItems()} keyed={(item) => item._id}>
                  {(item) => {
                    const children = () => items.childrenOf(item()._id);
                    return (
                      <section class="area-family">
                        {row(item(), { childCount: children().length })}
                        <Show when={expanded().has(item()._id)}>
                          <div class="area-children">
                            <For each={children()} keyed={(child) => child._id}>
                              {(child) =>
                                row(child(), { parentTitle: item().title })
                              }
                            </For>
                          </div>
                        </Show>
                      </section>
                    );
                  }}
                </For>
              </div>
            </Show>
          </>
        )}
      </Show>
      <Show when={editingArea() && area()}>
        <AreaEditor
          area={area() ?? null}
          onClose={() => setEditingArea(false)}
          onSave={(input) => void saveArea(input)}
        />
      </Show>
    </section>
  );
}

function AreaEmpty(props: { filtered: boolean; onCreate: () => void }) {
  return (
    <div class="area-detail-empty">
      <span>
        <Icon name={props.filtered ? "search" : "list"} size={26} />
      </span>
      <h3>{props.filtered ? "No matching Items" : "Nothing here yet"}</h3>
      <p>
        {props.filtered
          ? "Try another search or Item type."
          : "Add the first Item you want to keep in view inside this Area."}
      </p>
      <Show when={!props.filtered}>
        <button onClick={props.onCreate}>Create an Item</button>
      </Show>
    </div>
  );
}

function AreaUnavailable() {
  return (
    <div class="area-detail-empty">
      <span>
        <Icon name="folder" size={26} />
      </span>
      <h3>Area unavailable</h3>
      <p>This Area may have been archived or removed.</p>
      <Link to="/app/areas">Return to Areas</Link>
    </div>
  );
}
