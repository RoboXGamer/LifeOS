import type { Area } from "../types";
import { Show, createSignal } from "solid-js";
import { Icon } from "./Icon";

export function AreaCard(props: { area: Area; onAssignItem: (itemId: string, areaId: string) => void; onOpen: (areaId: string) => void }) {
  const [menuOpen, setMenuOpen] = createSignal(false);
  const clearDragState = (element: HTMLElement) => {
    element.dataset.dragCounter = "0";
    element.classList.remove("drag-over");
  };

  return (
    <article
      class={`area-card tone-${props.area.tone}`}
      role="button"
      tabindex="0"
      aria-label={`Open ${props.area.name} Area`}
      onClick={() => props.onOpen(props.area.id)}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") props.onOpen(props.area.id); }}
      onDragOver={event => event.preventDefault()}
      onDragEnter={event => {
        const card = event.currentTarget;
        const count = Number(card.dataset.dragCounter ?? 0) + 1;
        card.dataset.dragCounter = String(count);
        card.classList.add("drag-over");
      }}
      onDragLeave={event => {
        const card = event.currentTarget;
        const count = Number(card.dataset.dragCounter ?? 0) - 1;
        card.dataset.dragCounter = String(count);
        if (count <= 0) clearDragState(card);
      }}
      onDrop={event => {
        event.preventDefault();
        clearDragState(event.currentTarget);
        const itemId = event.dataTransfer?.getData("text/plain") ?? "";
        if (itemId) props.onAssignItem(itemId, props.area.id);
      }}
    >
      <div class="folder-tab" aria-hidden="true"/>
      <div class="area-art" aria-hidden="true">
        <span class="shape shape-a"/><span class="shape shape-b"/><span class="dot-field"/>
        <Icon name={props.area.artIcon ?? props.area.icon} size={58} strokeWidth={1.4}/>
      </div>
      <footer class="area-card-footer">
        <div><Icon name={props.area.icon === "heartPulse" ? "leaf" : props.area.icon} size={28}/><h2>{props.area.name}</h2></div>
        <div class="card-menu-wrap">
          <button aria-label={`More options for ${props.area.name}`} onClick={event => { event.stopPropagation(); setMenuOpen(value => !value); }}><Icon name="more" size={24}/></button>
          <Show when={menuOpen()}><div class="card-menu" onClick={event => event.stopPropagation()}><button onClick={() => props.onOpen(props.area.id)}><Icon name="folder" size={15}/> Open Area</button><button onClick={() => { void navigator.clipboard?.writeText(props.area.name); setMenuOpen(false); }}><Icon name="share" size={15}/> Copy name</button></div></Show>
        </div>
      </footer>
    </article>
  );
}
