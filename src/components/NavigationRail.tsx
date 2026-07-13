import { For } from "solid-js";
import type { AppView } from "../types";
import { Icon, type IconName } from "./Icon";

const navItems: { id: AppView; label: string; icon: IconName }[] = [
  { id: "inbox", label: "Inbox", icon: "inbox" },
  { id: "areas", label: "Areas", icon: "grid" },
  { id: "today", label: "Today", icon: "checkSquare" },
  { id: "upcoming", label: "Upcoming", icon: "calendar" },
  { id: "search", label: "Search", icon: "search" },
  { id: "tags", label: "Tags", icon: "tag" },
  { id: "archive", label: "Archive", icon: "archive" },
  { id: "settings", label: "Settings", icon: "settings" }
];

export function NavigationRail(props: { active: () => AppView; onNavigate: (view: AppView) => void }) {
  return (
    <aside class="nav-rail" aria-label="Primary navigation">
      <div class="window-controls" aria-hidden="true"><span class="window-dot red"/><span class="window-dot amber"/><span class="window-dot green"/></div>
      <button class="brand-mark" aria-label="Open Inbox" onClick={() => props.onNavigate("inbox")}><Icon name="inbox" size={33}/></button>
      <nav class="nav-items">
        <For each={navItems}>
          {item => (
            <button
              class={["nav-button", { active: props.active() === item.id }]}
              aria-label={item.label}
              title={item.label}
              onClick={() => props.onNavigate(item.id)}
            ><Icon name={item.icon} size={28}/></button>
          )}
        </For>
      </nav>
      <button class="avatar" aria-label="Open Settings" onClick={() => props.onNavigate("settings")}><span class="avatar-face">👨🏻</span><span class="presence"/></button>
    </aside>
  );
}
