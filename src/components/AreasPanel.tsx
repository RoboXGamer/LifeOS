import { For } from "solid-js";
import type { Area, ViewMode } from "../types";
import { AreaCard } from "./AreaCard";
import { Icon } from "./Icon";

export function AreasPanel(props: {
  areas: () => Area[];
  viewMode: () => ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onAddArea: () => void;
  onAssignItem: (itemId: string, areaId: string) => void;
  onOpenArea: (areaId: string) => void;
  onEditArea: (areaId: string) => void;
  onArchiveArea: (areaId: string) => void;
}) {
  return (
    <section class="areas-panel">
      <header class="areas-header">
        <div class="areas-title">
          <h1>Areas</h1>
          <p>Organize your life into areas that matter.</p>
        </div>
        <div class="areas-actions">
          <div class="view-toggle" aria-label="View style">
            <button class={{ active: props.viewMode() === "grid" }} onClick={() => props.onViewModeChange("grid")}>
              <Icon name="grid" size={20}/> Grid
            </button>
            <button class={{ active: props.viewMode() === "list" }} onClick={() => props.onViewModeChange("list")}>
              <Icon name="list" size={21}/> List
            </button>
          </div>
          <button class="add-area-button" onClick={props.onAddArea}><Icon name="plus" size={22}/> Add Area</button>
        </div>
      </header>

      <div class={["areas-grid", { "list-view": props.viewMode() === "list" }]}>
        <For each={props.areas()} keyed={area => area.id}>
          {area => <AreaCard area={area()} onAssignItem={props.onAssignItem} onOpen={props.onOpenArea} onEdit={props.onEditArea} onArchive={props.onArchiveArea}/>} 
        </For>
      </div>
    </section>
  );
}
