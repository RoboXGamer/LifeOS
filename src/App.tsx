import { Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { nanoid } from "nanoid";
import { useNavigate, useRouterState } from "@tanstack/solid-router";
import "./App.css";
import { AreasPanel } from "./components/AreasPanel";
import { AreaWorkspace, itemTypeIcon } from "./components/AreaWorkspace";
import { CaptureDialog } from "./components/CaptureDialog";
import { InboxPanel } from "./components/InboxPanel";
import { ItemInspector } from "./components/ItemInspector";
import { NavigationRail } from "./components/NavigationRail";
import { ArchiveWorkspace, InboxWorkspace, SearchWorkspace, SettingsWorkspace, TagsWorkspace, TodayWorkspace, UpcomingWorkspace } from "./components/V1Screens";
import { initialAreas, initialItems } from "./data/seed";
import { clearState, loadState, saveState } from "./data/storage";
import type { AppView, Area, Item, ItemColor, ItemFormValue, ItemPanelMode, ViewMode } from "./types";
import type { AppRouteSearch } from "./router";

const viewPaths = {
  inbox: "/inbox",
  areas: "/areas",
  today: "/today",
  upcoming: "/upcoming",
  search: "/search",
  tags: "/tags",
  archive: "/archive",
  settings: "/settings"
} as const;

function App() {
  const initialState = loadState({ items: initialItems, areas: initialAreas });
  const [items, setItems] = createSignal<Item[]>(initialState.items);
  const [areas, setAreas] = createSignal<Area[]>(initialState.areas);
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [dialog, setDialog] = createSignal<"capture" | "area" | null>(null);
  const routeLocation = useRouterState({ select: state => state.location });
  const routeNavigate = useNavigate();

  const routeSearch = () => routeLocation().search as AppRouteSearch;
  const selectedAreaId = () => /^\/areas\/([^/]+)$/.exec(routeLocation().pathname)?.[1] ?? null;
  const activeView = (): AppView => {
    const segment = routeLocation().pathname.split("/").filter(Boolean)[0];
    return segment && segment in viewPaths ? segment as AppView : "areas";
  };
  const selectedItemId = () => routeSearch().item ?? null;
  const panelMode = () => routeSearch().panel ?? null;
  const draftAreaId = () => routeSearch().area ?? null;
  const draftParentId = () => routeSearch().parent ?? null;

  createEffect(
    () => ({ items: items(), areas: areas() }),
    state => saveState(state)
  );

  const inboxItems = () => items().filter(item => item.areaId === null && !item.archived);
  const selectedArea = () => areas().find(area => area.id === selectedAreaId()) ?? null;
  const areaItems = () => items().filter(item => item.areaId === selectedAreaId());
  const selectedItem = () => items().find(item => item.id === selectedItemId()) ?? null;
  const selectedChildren = () => items().filter(item => item.parentId === selectedItemId());
  const possibleParents = () => items().filter(item => !item.archived && !item.parentId && item.id !== selectedItemId());

  const navigate = (view: AppView) => {
    void routeNavigate({ to: viewPaths[view], search: {} });
  };

  const updatePanelRoute = (search: AppRouteSearch, replace = false) => {
    const areaId = selectedAreaId();
    if (areaId) {
      void routeNavigate({ to: "/areas/$areaId", params: { areaId }, search, replace });
      return;
    }
    void routeNavigate({ to: viewPaths[activeView()], search, replace });
  };

  const captureItem = (title: string) => {
    const now = new Date().toISOString();
    setItems(current => [...current, { id: nanoid(), title, areaId: null, icon: "sparkle", color: "violet", parentId: null, archived: false, createdAt: now, updatedAt: now }]);
  };

  const addArea = (name: string) => {
    const palettes: Area["tone"][] = ["violet", "blue", "green", "amber", "coral", "teal"];
    const icons: Area["icon"][] = ["graduation", "briefcase", "folder", "chart", "user", "heart"];
    const now = new Date().toISOString();
    const offset = areas().length % palettes.length;
    setAreas(current => [...current, { id: nanoid(), name, tone: palettes[offset], icon: icons[offset], description: `Items and plans for ${name}.`, createdAt: now, updatedAt: now }]);
  };

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item));
  };

  const assignItemToArea = (itemId: string, areaId: string) => updateItem(itemId, { areaId });

  const openArea = (areaId: string) => {
    const firstItem = items().find(item => item.areaId === areaId && !item.parentId && !item.archived);
    void routeNavigate({
      to: "/areas/$areaId",
      params: { areaId },
      search: firstItem ? { item: firstItem.id, panel: "view" } : {}
    });
  };

  const closeArea = () => { void routeNavigate({ to: "/areas", search: {} }); };

  const toggleComplete = (id: string) => {
    setItems(current => current.map(item => item.id === id && item.type === "Task" ? { ...item, status: item.status === "Done" ? "Todo" : "Done", updatedAt: new Date().toISOString() } : item));
  };

  const openItem = (id: string) => {
    const item = items().find(candidate => candidate.id === id);
    if (!item) return;
    updatePanelRoute({ item: id, panel: item.archived ? "archived" : "view" });
  };
  const openNewItem = (areaId: string | null = selectedAreaId(), parentId: string | null = null) => {
    updatePanelRoute({ panel: "create", area: areaId ?? undefined, parent: parentId ?? undefined });
  };

  const saveItem = (value: ItemFormValue) => {
    const now = new Date().toISOString();
    const currentEditingId = selectedItemId();
    const normalized = {
      ...value,
      status: value.type === "Task" ? (value.status ?? "Todo") : undefined,
      amount: value.type === "Expense" || value.type === "Payment" ? value.amount : undefined,
      isSettled: value.type === "Expense" || value.type === "Payment" ? value.isSettled : undefined,
      parentId: value.parentId && items().some(item => item.id === value.parentId && !item.parentId && item.areaId === value.areaId) ? value.parentId : null
    };
    if (currentEditingId) {
      setItems(current => current.map(item => item.id === currentEditingId ? { ...item, ...normalized, icon: itemTypeIcon(value.type), updatedAt: now } : item));
      updatePanelRoute({ item: currentEditingId, panel: "view" }, true);
      return;
    }
    const colors: Record<ItemFormValue["type"], ItemColor> = { Task: "violet", Note: "amber", Event: "green", Expense: "orange", Payment: "teal" };
    const newItem: Item = { id: nanoid(), icon: itemTypeIcon(value.type), color: colors[value.type], archived: false, createdAt: now, updatedAt: now, ...normalized };
    setItems(current => [...current, newItem]);
    updatePanelRoute({ item: newItem.id, panel: "view" }, true);
  };

  const closePanel = () => updatePanelRoute({});
  const changePanelMode = (mode: ItemPanelMode) => updatePanelRoute({ item: selectedItemId() ?? undefined, panel: mode, area: draftAreaId() ?? undefined, parent: draftParentId() ?? undefined }, true);
  const archiveItem = (id: string) => { updateItem(id, { archived: true }); updatePanelRoute({ item: id, panel: "archived" }, true); };
  const restoreItem = (id: string) => { updateItem(id, { archived: false }); updatePanelRoute({ item: id, panel: "view" }, true); };
  const deleteItem = (id: string) => { if (!window.confirm("Permanently delete this item and its child items?")) return; setItems(current => current.filter(item => item.id !== id && item.parentId !== id)); closePanel(); };
  const toggleFavorite = (id: string) => updateItem(id, { favorite: !items().find(item => item.id === id)?.favorite });
  const archiveCompleted = () => setItems(current => current.map(item => item.type === "Task" && item.status === "Done" ? { ...item, archived: true, updatedAt: new Date().toISOString() } : item));
  const resetData = () => { clearState(); setItems(initialItems); setAreas(initialAreas); void routeNavigate({ to: "/areas", search: {} }); };

  return (
    <main class={["app-shell", { "detail-shell": !!selectedArea(), "panel-shell": !!panelMode(), "inspector-closed": !!selectedArea() && !panelMode() }]}> 
      <NavigationRail active={() => selectedArea() ? "areas" : activeView()} onNavigate={navigate}/>
      <InboxPanel items={inboxItems} onQuickCapture={() => setDialog("capture")} onOpenItem={openItem}/>

      <Show when={selectedArea()} keyed fallback={
        <Switch fallback={<AreasPanel areas={areas} viewMode={viewMode} onViewModeChange={setViewMode} onAddArea={() => setDialog("area")} onAssignItem={assignItemToArea} onOpenArea={openArea}/>}>
          <Match when={activeView() === "inbox"}><InboxWorkspace items={inboxItems} areas={areas} onCapture={() => setDialog("capture")} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "areas"}><AreasPanel areas={areas} viewMode={viewMode} onViewModeChange={setViewMode} onAddArea={() => setDialog("area")} onAssignItem={assignItemToArea} onOpenArea={openArea}/></Match>
          <Match when={activeView() === "today"}><TodayWorkspace items={items} areas={areas} onEdit={openItem} onToggle={toggleComplete} onCapture={() => openNewItem(null)}/></Match>
          <Match when={activeView() === "upcoming"}><UpcomingWorkspace items={items} areas={areas} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "search"}><SearchWorkspace items={items} areas={areas} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "tags"}><TagsWorkspace items={items} areas={areas} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "archive"}><ArchiveWorkspace items={items} areas={areas} onOpen={openItem} onRestore={restoreItem} onDelete={deleteItem}/></Match>
          <Match when={activeView() === "settings"}><SettingsWorkspace itemCount={items().length} areaCount={areas().length} onReset={resetData} onArchiveCompleted={archiveCompleted}/></Match>
        </Switch>
      }>
        {area => <AreaWorkspace area={area} items={areaItems} selectedId={selectedItemId} onBack={closeArea} onNewItem={() => openNewItem(area.id)} onSelectItem={openItem} onToggleComplete={toggleComplete}/>} 
      </Show>

      <Show when={panelMode()} keyed>
        {mode => <ItemInspector mode={mode} item={selectedItem()} areas={areas()} children={selectedChildren()} possibleParents={possibleParents()} initialAreaId={draftAreaId()} initialParentId={draftParentId()} onClose={closePanel} onModeChange={changePanelMode} onSave={saveItem} onArchive={() => selectedItemId() && archiveItem(selectedItemId()!)} onRestore={() => selectedItemId() && restoreItem(selectedItemId()!)} onDelete={() => selectedItemId() && deleteItem(selectedItemId()!)} onToggleFavorite={() => selectedItemId() && toggleFavorite(selectedItemId()!)} onOpenItem={openItem} onAddChild={() => openNewItem(selectedItem()?.areaId ?? null, selectedItemId())}/>} 
      </Show>

      <CaptureDialog mode={dialog} onClose={() => setDialog(null)} onCaptureItem={captureItem} onAddArea={addArea}/>
    </main>
  );
}

export default App;
