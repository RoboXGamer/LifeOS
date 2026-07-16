import { render } from "@solidjs/web";
import "./index.css";
import App from "./App.tsx";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/solid-router";
import Areas from "./pages/Areas.tsx";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <App />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <>
      <Areas />
    </>
  ),
});

const todayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/today",
  component: () => (
    <>
      <h2>Today</h2>
    </>
  ),
});

const upcomingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/upcoming",
  component: () => (
    <>
      <h2>Upcoming</h2>
    </>
  ),
});

const tagsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tags",
  component: () => (
    <>
      <h2>Tags</h2>
    </>
  ),
});

const archiveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/archive",
  component: () => (
    <>
      <h2>Archive</h2>
    </>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  todayRoute,
  upcomingRoute,
  tagsRoute,
  archiveRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
render(() => <RouterProvider router={router} />, root!);
