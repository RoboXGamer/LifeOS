import { createSignal, For, Show } from "solid-js";
import { Link, useParams } from "@tanstack/solid-router";
import type { Id } from "../../convex/_generated/dataModel";
import { Icon, type IconName } from "../Icon";
import { ItemRow } from "../features/items/ItemRow";
import {
  useItems,
  type ItemType,
  type ItemView,
} from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import "./AreaDetail.css";

const types: Array<ItemType | "All"> = [
  "All",
  "Task",
  "Note",
  "Event",
  "Expense",
  "Payment",
];

export default function AreaDetail() {
  const params = useParams({ from: "/app/areas/$areaId" });
  const items = useItems();
  const panel = useItemPanelRoute();
  const [search, setSearch] = createSignal("");
  const [type, setType] = createSignal<ItemType | "All">("All");
  const [expanded, setExpanded] = createSignal(new Set<string>());
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
  const row = (item: ItemView, childCount = 0) => (
    <ItemRow
      item={item}
      areaName={area()?.name}
      childCount={childCount}
      onOpen={open}
      onToggleTask={toggleTask}
    />
  );

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
                  <button
                    class={{ active: type() === itemType }}
                    onClick={() =>
                      setType(type() === itemType ? "All" : itemType)
                    }
                  >
                    <strong>{count(itemType)}</strong>
                    <span>{itemType}s</span>
                  </button>
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
              <span>Item</span>
              <span>Tags</span>
              <span>Priority</span>
              <span>Details</span>
              <span />
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
                        <div class="area-family-row">
                          <Show
                            when={children().length > 0}
                            fallback={<span class="family-spacer" />}
                          >
                            <button
                              class="family-toggle"
                              aria-label={`Toggle children for ${item().title}`}
                              aria-expanded={
                                expanded().has(item()._id) ? "true" : "false"
                              }
                              onClick={() => toggleExpanded(item()._id)}
                            >
                              <Icon
                                name={
                                  expanded().has(item()._id)
                                    ? "chevronDown"
                                    : "chevronRight"
                                }
                                size={15}
                              />
                            </button>
                          </Show>
                          {row(item(), children().length)}
                        </div>
                        <Show when={expanded().has(item()._id)}>
                          <div class="area-children">
                            <For each={children()} keyed={(child) => child._id}>
                              {(child) => row(child())}
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
