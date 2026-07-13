import { createRootRoute, createRoute, createRouter } from "@tanstack/solid-router";
import App from "./App";
import type { ItemPanelMode } from "./types";

export type AppRouteSearch = {
  item?: string;
  panel?: ItemPanelMode;
  area?: string;
  parent?: string;
};

const panelModes = new Set<ItemPanelMode>(["view", "edit", "create", "archived"]);

const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>): AppRouteSearch => ({
    item: typeof search.item === "string" ? search.item : undefined,
    panel: typeof search.panel === "string" && panelModes.has(search.panel as ItemPanelMode) ? search.panel as ItemPanelMode : undefined,
    area: typeof search.area === "string" ? search.area : undefined,
    parent: typeof search.parent === "string" ? search.parent : undefined
  }),
  component: App,
  notFoundComponent: App
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/" });
const inboxRoute = createRoute({ getParentRoute: () => rootRoute, path: "inbox" });
const areasRoute = createRoute({ getParentRoute: () => rootRoute, path: "areas" });
const areaRoute = createRoute({ getParentRoute: () => rootRoute, path: "areas/$areaId" });
const todayRoute = createRoute({ getParentRoute: () => rootRoute, path: "today" });
const upcomingRoute = createRoute({ getParentRoute: () => rootRoute, path: "upcoming" });
const searchRoute = createRoute({ getParentRoute: () => rootRoute, path: "search" });
const tagsRoute = createRoute({ getParentRoute: () => rootRoute, path: "tags" });
const archiveRoute = createRoute({ getParentRoute: () => rootRoute, path: "archive" });
const settingsRoute = createRoute({ getParentRoute: () => rootRoute, path: "settings" });

const routeTree = rootRoute.addChildren([
  indexRoute,
  inboxRoute,
  areasRoute,
  areaRoute,
  todayRoute,
  upcomingRoute,
  searchRoute,
  tagsRoute,
  archiveRoute,
  settingsRoute
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}
