import { render } from "@solidjs/web";
import "./index.css";
import { RouterProvider } from "@tanstack/solid-router";
import { ConvexProvider, convex } from "./convex";
import { router } from "./router";

const root = document.getElementById("root");
render(
  () => (
    <ConvexProvider client={convex}>
      <RouterProvider router={router} />
    </ConvexProvider>
  ),
  root!,
);
