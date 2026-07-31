import { render } from "@solidjs/web";
import "./index.css";
import { RouterProvider } from "@tanstack/solid-router";
import { ConvexProvider, convex } from "./convex";
import { router } from "./router";
import { AuthProvider } from "./auth/context";

const root = document.getElementById("root");
render(
  () => (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ConvexProvider>
  ),
  root!,
);
