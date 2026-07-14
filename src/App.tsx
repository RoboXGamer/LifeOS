import { createSignal, For } from "solid-js";
import "./App.css";
import { Icon } from "./Icon.tsx";
import Avatar from "./Avatar.tsx";

const navItems = [
  { id: "areas", label: "Areas", icon: "grid" },
  { id: "today", label: "Today", icon: "checkSquare" },
  { id: "upcoming", label: "Upcoming", icon: "calendar" },
  { id: "tags", label: "Tags", icon: "tag" },
  { id: "archive", label: "Archive", icon: "archive" },
] as const;

function App() {
  const [inboxOpen, toggleInbox] = createSignal(false);
  const [activeView, setActiveView] = createSignal<string>(navItems[0].id);
  return (
    <>
      <div id="app">
        <aside class="sidebar">
          <span>{/* {sidebarW()} x {sidebarH()} */}</span>
          <nav class="nav-items">
            <button
              class={["nav-button", { active: inboxOpen() }]}
              aria-label="Inbox"
              title="Inbox"
              onClick={() => toggleInbox((p) => !p)}
            >
              <Icon name="inbox" size={22} />
            </button>
            <hr class="nav-sep" />
            <For each={navItems}>
              {(item) => (
                <button
                  class={["nav-button", { active: activeView() === item.id }]}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setActiveView(item.id)}
                >
                  <Icon name={item.icon} size={22} />
                </button>
              )}
            </For>
          </nav>
          <Avatar size={40} fallback="PR" />
        </aside>
        <main class="main">
          <h2>
            {navItems.find((item) => item.id === activeView())?.label ?? "???"}
          </h2>
        </main>
      </div>
    </>
  );
}

export default App;
