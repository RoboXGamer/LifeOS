import { useNavigate, useRouterState } from "@tanstack/solid-router";
import type { AppRouteSearch, ItemPanelMode } from "../../router";

export function useItemPanelRoute() {
  const location = useRouterState({ select: (state) => state.location });
  const navigate = useNavigate();
  const search = () => location().search as AppRouteSearch;

  const update = (next: AppRouteSearch, replace = false) => {
    const pathname = location().pathname;
    const areaMatch = /^\/app\/areas\/([^/]+)$/.exec(pathname);
    const calendarMatch = /^\/app\/areas\/([^/]+)\/calendar$/.exec(pathname);

    if (calendarMatch) {
      void navigate({
        to: "/app/areas/$areaId/calendar",
        params: { areaId: calendarMatch[1] },
        search: next,
        replace,
      });
      return;
    }
    if (areaMatch) {
      void navigate({
        to: "/app/areas/$areaId",
        params: { areaId: areaMatch[1] },
        search: next,
        replace,
      });
      return;
    }

    const routes = [
      "/app/areas",
      "/app/today",
      "/app/upcoming",
      "/app/tags",
      "/app/archive",
      "/app/settings",
    ] as const;
    const target = routes.find((route) => route === pathname) ?? "/app/areas";
    void navigate({ to: target, search: next, replace });
  };

  const openItem = (itemId: string, mode: ItemPanelMode = "view") =>
    update({ item: itemId, mode });
  const createItem = (options?: {
    area?: string;
    parent?: string;
    date?: string;
  }) =>
    update({
      mode: "create",
      area: options?.area,
      parent: options?.parent,
      date: options?.date,
    });
  const close = () => update({});

  return { search, update, openItem, createItem, close };
}
