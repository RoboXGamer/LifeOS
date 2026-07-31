import { createEffect, createSignal, For, onSettled } from "solid-js";
import "./App.css";
import { Icon } from "./Icon.tsx";
import { Outlet, Link, useLocation } from "@tanstack/solid-router";
import { WorkspaceProvider } from "./features/workspaces/context";
import { WorkspaceMenu } from "./features/workspaces/WorkspaceMenu";
import { ItemProvider } from "./features/items/context";
import { InboxPanel } from "./features/items/InboxPanel";
import { ItemInspector } from "./features/items/ItemInspector";

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
      <ItemProvider>
        <AppShell />
      </ItemProvider>
    </WorkspaceProvider>
  );
}

function AppShell() {
  const [inboxOpen, toggleInbox] = createSignal(false);
  const location = useLocation();
  const closeInbox = (returnFocus = true) => {
    toggleInbox(false);
    if (returnFocus) {
      queueMicrotask(() =>
        document
          .querySelector<HTMLButtonElement>('button[aria-label="Inbox"]')
          ?.focus(),
      );
    }
  };

  createEffect(inboxOpen, (open) => {
    if (open) {
      queueMicrotask(() =>
        document.querySelector<HTMLInputElement>("#quick-capture")?.focus(),
      );
    }
  });

  onSettled(() => {
    const openInbox = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.code === "Space") {
        event.preventDefault();
        toggleInbox(true);
      }
    };
    window.addEventListener("keydown", openInbox);
    return () => window.removeEventListener("keydown", openInbox);
  });

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
                  onClick={() => toggleInbox(false)}
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
        <div class="overlay-layer">
          <div
            class={["inbox-host", { open: inboxOpen() }]}
            aria-hidden={inboxOpen() ? "false" : "true"}
          >
            <InboxPanel onClose={closeInbox} />
          </div>
          <ItemInspector />
        </div>
      </div>
    </>
  );
}

export default App;
