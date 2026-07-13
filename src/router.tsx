import { createRootRoute, createRoute, createRouter } from "@tanstack/solid-router";
import App from "./App";
import { appRouteSearchSchema } from "./schemas";

const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => appRouteSearchSchema.parse(search),
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
