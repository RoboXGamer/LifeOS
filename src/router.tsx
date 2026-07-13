import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/solid-router";
import App from "./App";
import { LandingPage } from "./LandingPage";
import { appRouteSearchSchema } from "./schemas";

const rootRoute = createRootRoute({
  validateSearch: (search: Record<string, unknown>) => appRouteSearchSchema.parse(search),
  component: () => <Outlet/>
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: LandingPage });
const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: "dashboard", component: App });
const dashboardIndexRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "/" });
const inboxRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "inbox" });
const areasRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "areas" });
const areaRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "areas/$areaId" });
const areaCalendarRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "areas/$areaId/calendar" });
const todayRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "today" });
const upcomingRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "upcoming" });
const searchRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "search" });
const tagsRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "tags" });
const archiveRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "archive" });
const settingsRoute = createRoute({ getParentRoute: () => dashboardRoute, path: "settings" });

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute.addChildren([
    dashboardIndexRoute,
    inboxRoute,
    areasRoute,
    areaRoute,
    areaCalendarRoute,
    todayRoute,
    upcomingRoute,
    searchRoute,
    tagsRoute,
    archiveRoute,
    settingsRoute
  ])
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
