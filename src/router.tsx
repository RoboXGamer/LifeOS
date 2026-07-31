import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/solid-router";
import App from "./App";
import AreaDetail from "./pages/AreaDetail";
import AreaCalendar from "./pages/AreaCalendar";
import Areas from "./pages/Areas";
import Archive from "./pages/Archive";
import Settings from "./pages/Settings";
import Tags from "./pages/Tags";
import Today from "./pages/Today";
import Upcoming from "./pages/Upcoming";
import {
  NotFoundPage,
  RouteErrorPage,
} from "./pages/Placeholder";

export type ItemPanelMode = "view" | "edit" | "create" | "archived";

export interface AppRouteSearch {
  item?: string;
  mode?: ItemPanelMode;
  parent?: string;
  area?: string;
  date?: string;
}

function validateAppSearch(search: Record<string, unknown>): AppRouteSearch {
  const modes: ItemPanelMode[] = ["view", "edit", "create", "archived"];
  return {
    item: typeof search.item === "string" ? search.item : undefined,
    mode: modes.includes(search.mode as ItemPanelMode)
      ? (search.mode as ItemPanelMode)
      : undefined,
    parent: typeof search.parent === "string" ? search.parent : undefined,
    area: typeof search.area === "string" ? search.area : undefined,
    date: typeof search.date === "string" ? search.date : undefined,
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
  path: "/app",
  component: App,
});

const appIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/app/areas" });
  },
});

const areasRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/areas",
  validateSearch: validateAppSearch,
  component: Areas,
});

const areaRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/areas/$areaId",
  validateSearch: validateAppSearch,
  component: AreaDetail,
});

const areaCalendarRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/areas/$areaId/calendar",
  validateSearch: validateAppSearch,
  component: AreaCalendar,
});

const todayRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/today",
  validateSearch: validateAppSearch,
  component: Today,
});

const upcomingRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/upcoming",
  validateSearch: validateAppSearch,
  component: Upcoming,
});

const tagsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/tags",
  validateSearch: validateAppSearch,
  component: Tags,
});

const archiveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/archive",
  validateSearch: validateAppSearch,
  component: Archive,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  validateSearch: validateAppSearch,
  component: Settings,
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
