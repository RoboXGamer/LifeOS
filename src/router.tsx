import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/solid-router";
import App from "./App";
import Areas from "./pages/Areas";
import {
  NotFoundPage,
  PlaceholderPage,
  RouteErrorPage,
} from "./pages/Placeholder";

export type ItemPanelMode = "view" | "edit" | "create" | "archived";

export interface AppRouteSearch {
  item?: string;
  mode?: ItemPanelMode;
  parent?: string;
}

function validateAppSearch(search: Record<string, unknown>): AppRouteSearch {
  const modes: ItemPanelMode[] = ["view", "edit", "create", "archived"];
  return {
    item: typeof search.item === "string" ? search.item : undefined,
    mode: modes.includes(search.mode as ItemPanelMode)
      ? (search.mode as ItemPanelMode)
      : undefined,
    parent: typeof search.parent === "string" ? search.parent : undefined,
  };
}

const rootRoute = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  errorComponent: (props) => <RouteErrorPage error={props.error} />,
});

const landingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <main class="landing-placeholder">
      <span>Life OS</span>
      <h1>Keep every important part of life in view.</h1>
      <a href="/app/areas">Open Life OS</a>
    </main>
  ),
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: App,
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app",
  beforeLoad: () => {
    throw redirect({ to: "/app/areas" });
  },
});

const areasRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/areas",
  validateSearch: validateAppSearch,
  component: Areas,
});

const areaRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/areas/$areaId",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Area" />,
});

const areaCalendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/areas/$areaId/calendar",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Area calendar" />,
});

const todayRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/today",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Today" />,
});

const upcomingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/upcoming",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Upcoming" />,
});

const tagsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/tags",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Tags" />,
});

const archiveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/archive",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Archive" />,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/app/settings",
  validateSearch: validateAppSearch,
  component: () => <PlaceholderPage title="Settings" />,
});

const routeTree = rootRoute.addChildren([
  landingRoute,
  appRoute.addChildren([
    appIndexRoute,
    areasRoute,
    areaRoute,
    areaCalendarRoute,
    todayRoute,
    upcomingRoute,
    tagsRoute,
    archiveRoute,
    settingsRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}
