import { For, Show } from "solid-js";
import { Link, useParams } from "@tanstack/solid-router";
import type { Id } from "../../convex/_generated/dataModel";
import { Icon, type IconName } from "../Icon";
import { useItems } from "../features/items/context";
import { useItemPanelRoute } from "../features/items/routing";
import { dueDateLabel, itemIcon } from "../features/items/types";
import "./AreaDetail.css";

export default function AreaDetail() {
  const params = useParams({ from: "/app/areas/$areaId" });
  const items = useItems();
  const panel = useItemPanelRoute();
  const areaId = () => params().areaId as Id<"areas">;
  const area = () => items.areas().find((entry) => entry._id === areaId());
  const areaItems = () =>
    items.activeItems.filter(
      (item) => item.areaId === areaId() && item.parentId === null,
    );

  return (
    <section class="area-detail-page">
      <header class="area-detail-header">
        <div class="area-detail-heading">
          <Link to="/app/areas" aria-label="Back to Areas">
            <Icon name="chevronRight" size={18} />
          </Link>
          <Show
            when={area()}
            fallback={
              <div>
                <span>Area unavailable</span>
                <h2>This Area is no longer active.</h2>
              </div>
            }
          >
            {(currentArea) => (
              <>
                <span
                  class="area-detail-mark"
                  style={{ "--_area-color": currentArea().color }}
                >
                  <Icon
                    name={currentArea().icon as IconName}
                    size={24}
                    strokeWidth={1.7}
                  />
                </span>
                <div>
                  <span>Area</span>
                  <h2>{currentArea().name}</h2>
                  <Show when={currentArea().description}>
                    <p>{currentArea().description}</p>
                  </Show>
                </div>
              </>
            )}
          </Show>
        </div>
        <button
          type="button"
          class="primary-action"
          disabled={!area()}
          onClick={() => panel.createItem({ area: areaId() })}
        >
          <Icon name="plus" size={18} />
          New Item
        </button>
      </header>

      <Show
        when={areaItems().length > 0}
        fallback={
          <div class="area-detail-empty">
            <span>
              <Icon name="list" size={26} />
            </span>
            <h3>Nothing here yet</h3>
            <p>Add the first Item you want to keep in view inside this Area.</p>
            <button
              type="button"
              onClick={() => panel.createItem({ area: areaId() })}
            >
              Create an Item
            </button>
          </div>
        }
      >
        <div class="area-item-list">
          <For each={areaItems()} keyed={(item) => item._id}>
            {(item) => (
              <article
                class={["life-item", { complete: item().status === "Done" }]}
              >
                <Show
                  when={item().type === "Task"}
                  fallback={
                    <span class="life-item-icon">
                      <Icon name={itemIcon(item().type)} size={18} />
                    </span>
                  }
                >
                  <button
                    type="button"
                    class="task-toggle"
                    aria-label={
                      item().status === "Done"
                        ? `Mark ${item().title} incomplete`
                        : `Complete ${item().title}`
                    }
                    onClick={() =>
                      items.setTaskDone(item()._id, item().status !== "Done")
                    }
                  >
                    <Icon name="checkSquare" size={18} />
                  </button>
                </Show>
                <button
                  type="button"
                  class="life-item-main"
                  onClick={() => panel.openItem(item()._id)}
                >
                  <strong>{item().title}</strong>
                  <span>
                    {item().type ?? "Unsorted"}
                    <Show when={dueDateLabel(item().dueDate)}>
                      {(date) => <> · {date()}</>}
                    </Show>
                    <Show when={item().tags.length > 0}>
                      <> · {item().tags.slice(0, 2).join(", ")}</>
                    </Show>
                  </span>
                </button>
                <Show when={items.childrenOf(item()._id).length}>
                  <span class="child-count">
                    {items.childrenOf(item()._id).length}
                    <Icon name="chevronRight" size={14} />
                  </span>
                </Show>
                <button
                  type="button"
                  class="life-item-more"
                  aria-label={`Open ${item().title}`}
                  onClick={() => panel.openItem(item()._id)}
                >
                  <Icon name="more" size={18} />
                </button>
              </article>
            )}
          </For>
        </div>
      </Show>
    </section>
  );
}
