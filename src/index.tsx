import { render } from "@solidjs/web";
import { RouterProvider } from "@tanstack/solid-router";
import "./index.css";
import { router } from "./router";

const root = document.getElementById("root");

render(() => <RouterProvider router={router}/>, root!);
