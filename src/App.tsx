import { createEffect, createSignal, For, onSettled, Show } from "solid-js";
import "./App.css";
import { Icon } from "./Icon.tsx";
import { Outlet, Link, useLocation } from "@tanstack/solid-router";
import { WorkspaceProvider } from "./features/workspaces/context";
import { WorkspaceMenu } from "./features/workspaces/WorkspaceMenu";
import { ItemProvider } from "./features/items/context";
import { InboxPanel } from "./features/items/InboxPanel";
import { ItemInspector } from "./features/items/ItemInspector";
import { SearchPanel } from "./features/items/SearchPanel";
import { AuthProvider } from "./auth/context";

const navItems = [
  { id: "areas", label: "Areas", icon: "grid" },
  { id: "today", label: "Today", icon: "checkSquare" },
  { id: "upcoming", label: "Upcoming", icon: "calendar" },
  { id: "tags", label: "Tags", icon: "tag" },
  { id: "archive", label: "Archive", icon: "archive" },
] as const;

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <ItemProvider>
          <AppShell />
        </ItemProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const [inboxOpen, toggleInbox] = createSignal(false);
  const [searchOpen, setSearchOpen] = createSignal(false);
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
  const closeSearch = () => {
    setSearchOpen(false);
    queueMicrotask(() =>
      document
        .querySelector<HTMLButtonElement>(".global-search-trigger")
        ?.focus(),
    );
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
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        queueMicrotask(() =>
          document
            .querySelector<HTMLInputElement>("#global-search-input")
            ?.focus(),
        );
      }
      if (event.key === "Escape" && searchOpen()) closeSearch();
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
          <button
            type="button"
            class="global-search-trigger"
            aria-label="Search Items"
            title="Search Items (Ctrl/⌘ K)"
            onClick={() => {
              setSearchOpen(true);
              queueMicrotask(() =>
                document
                  .querySelector<HTMLInputElement>("#global-search-input")
                  ?.focus(),
              );
            }}
          >
            <Icon name="search" size={18} />
          </button>
          <Outlet />
        </main>
        <div class="overlay-layer">
          <Show when={inboxOpen()}>
            <div class="inbox-host open">
              <InboxPanel onClose={closeInbox} />
            </div>
          </Show>
          <ItemInspector />
          <Show when={searchOpen()}>
            <div class="search-host open" onClick={closeSearch}>
              <SearchPanel onClose={closeSearch} />
            </div>
          </Show>
        </div>
      </div>
    </>
  );
}

export default App;
