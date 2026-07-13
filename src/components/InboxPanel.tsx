import { For } from "solid-js";
import type { Item } from "../types";
import { Icon } from "./Icon";

export function InboxPanel(props: { items: () => Item[]; onQuickCapture: () => void; onOpenItem: (id: string) => void }) {
  return (
    <aside class="inbox-panel">
      <header class="inbox-header">
        <div>
          <h1>Inbox</h1>
          <p>{props.items().length} items</p>
        </div>
        <button class="icon-button edit-button" aria-label="Quick capture" onClick={props.onQuickCapture}>
          <Icon name="edit" size={24}/>
        </button>
      </header>

      <ol class="inbox-list">
        <For each={props.items()} keyed={item => item.id}>
          {item => (
            <li
              class={`inbox-item item-${item().color}`}
              draggable="true"
              onDragStart={event => {
                event.dataTransfer?.setData("text/plain", item().id);
                if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => props.onOpenItem(item().id)}
            >
              <Icon name={item().icon} size={25}/>
              <span>{item().title}</span>
              <i aria-hidden="true"/>
            </li>
          )}
        </For>
      </ol>

      <footer class="quick-capture-bar">
        <button onClick={props.onQuickCapture}>
          <span class="capture-icon"><Icon name="inbox" size={20}/></span>
          <span>Quick Capture</span>
        </button>
        <span class="shortcut">Ctrl Space</span>
      </footer>
    </aside>
  );
}
