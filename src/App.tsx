import { createSignal, For } from "solid-js";
import "./App.css";
import { Icon } from "./Icon.tsx";
import { Outlet, Link, useLocation } from "@tanstack/solid-router";
import { WorkspaceProvider } from "./features/workspaces/context";
import { WorkspaceMenu } from "./features/workspaces/WorkspaceMenu";

const navItems = [
  { id: "areas", label: "Areas", icon: "grid" },
  { id: "today", label: "Today", icon: "checkSquare" },
  { id: "upcoming", label: "Upcoming", icon: "calendar" },
  { id: "tags", label: "Tags", icon: "tag" },
  { id: "archive", label: "Archive", icon: "archive" },
] as const;

function App() {
  return (
    <WorkspaceProvider>
      <AppShell />
    </WorkspaceProvider>
  );
}

function AppShell() {
  const [inboxOpen, toggleInbox] = createSignal(false);
  const location = useLocation();
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
                <Link
                  class={[
                    "nav-button" +
                      (`/app/${item.id}` === location().pathname
                        ? " active"
                        : ""),
                  ]}
                  aria-label={item.label}
                  title={item.label}
                  to={`/app/${item.id}`}
                >
                  <Icon name={item.icon} size={22} />
                </Link>
              )}
            </For>
          </nav>
          <WorkspaceMenu />
        </aside>
        <main class="main">
          <Outlet />
        </main>
      </div>
    </>
  );
}

export default App;
