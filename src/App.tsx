import { Match, Show, Switch, createEffect, createSignal, onCleanup } from "solid-js";
import { nanoid } from "nanoid";
import { useNavigate, useRouterState } from "@tanstack/solid-router";
import "./App.css";
import { AreasPanel } from "./components/AreasPanel";
import { AreaDialog, type AreaFormValue } from "./components/AreaDialog";
import { AreaWorkspace } from "./components/AreaWorkspace";
import { CaptureDialog } from "./components/CaptureDialog";
import { InboxPanel } from "./components/InboxPanel";
import { ItemInspector } from "./components/ItemInspector";
import { NavigationRail } from "./components/NavigationRail";
import { ArchiveWorkspace, InboxWorkspace, SearchWorkspace, SettingsWorkspace, TagsWorkspace, TodayWorkspace, UpcomingWorkspace } from "./components/V1Screens";
import { initialAreas, initialItems, initialTags, initialWorkspace } from "./data/seed";
import { clearState, loadState, saveState } from "./data/storage";
import { areaSchema, itemFormSchema, itemSchema, normalizeItemFields, workspaceSchema } from "./schemas";
import type { AppRouteSearch, AppState, AppView, Area, Item, ItemColor, ItemFormValue, ItemPanelMode, ViewMode } from "./types";

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
  const fallbackState: AppState = { version: 2, workspace: initialWorkspace, areas: initialAreas, items: initialItems, tags: initialTags };
  const initialState = loadState(fallbackState);
  const [workspace, setWorkspace] = createSignal(initialState.workspace);
  const [items, setItems] = createSignal<Item[]>(initialState.items);
  const [areas, setAreas] = createSignal<Area[]>(initialState.areas);
  const [tags, setTags] = createSignal<string[]>(initialState.tags);
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [dialog, setDialog] = createSignal<"capture" | null>(null);
  const [areaEditorId, setAreaEditorId] = createSignal<"new" | string | null>(null);
  const [saveMessage, setSaveMessage] = createSignal("Saved locally");
  const mobileQuery = window.matchMedia("(max-width: 850px)");
  const [isMobile, setIsMobile] = createSignal(mobileQuery.matches);
  const [inboxCollapsed, setInboxCollapsed] = createSignal(mobileQuery.matches || localStorage.getItem("life-os-inbox-collapsed") === "true");
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
    () => ({ version: 2 as const, workspace: workspace(), items: items(), areas: areas(), tags: tags() }),
    state => {
      const result = saveState(state);
      setSaveMessage(result.ok ? "Saved locally" : "Save failed");
    }
  );

  const openCapture = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === "Space") {
      event.preventDefault();
      setDialog("capture");
    }
  };
  window.addEventListener("keydown", openCapture);
  const handleMobileChange = (event: MediaQueryListEvent) => { setIsMobile(event.matches); if (event.matches) setInboxCollapsed(true); };
  mobileQuery.addEventListener("change", handleMobileChange);
  onCleanup(() => { window.removeEventListener("keydown", openCapture); mobileQuery.removeEventListener("change", handleMobileChange); });

  const inboxItems = () => items().filter(item => item.areaId === null && !item.archived);
  const activeAreas = () => areas().filter(area => !area.archived);
  const archivedAreas = () => areas().filter(area => area.archived);
  const selectedArea = () => activeAreas().find(area => area.id === selectedAreaId()) ?? null;
  const areaItems = () => items().filter(item => item.areaId === selectedAreaId());
  const selectedItem = () => items().find(item => item.id === selectedItemId()) ?? null;
  const selectedChildren = () => items().filter(item => item.parentId === selectedItemId());
  const possibleParents = () => {
    const areaId = selectedItem()?.areaId ?? draftAreaId();
    return items().filter(item => !item.archived && !item.parentId && item.id !== selectedItemId() && item.areaId === areaId);
  };

  const navigate = (view: AppView) => {
    if (isMobile()) setInboxCollapsed(true);
    void routeNavigate({ to: viewPaths[view], search: {} });
  };

  const toggleInboxPanel = () => setInboxCollapsed(current => {
    const next = !current;
    if (!isMobile()) localStorage.setItem("life-os-inbox-collapsed", String(next));
    return next;
  });

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
    const item = itemSchema.parse({ id: nanoid(), workspaceId: workspace().id, title, areaId: null, color: "violet", type: "Task", status: "Todo", tags: [], parentId: null, archived: false, favorite: false, createdAt: now, updatedAt: now });
    setItems(current => [...current, item]);
  };

  const saveArea = (value: AreaFormValue) => {
    const now = new Date().toISOString();
    const editingId = areaEditorId();
    if (editingId && editingId !== "new") {
      setAreas(current => current.map(area => area.id === editingId ? areaSchema.parse({ ...area, ...value, updatedAt: now }) : area));
    } else {
      setAreas(current => [...current, areaSchema.parse({ id: nanoid(), workspaceId: workspace().id, archived: false, createdAt: now, updatedAt: now, ...value })]);
    }
    setAreaEditorId(null);
  };

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems(current => current.map(item => item.id === id ? itemSchema.parse({ ...item, ...patch, updatedAt: new Date().toISOString() }) : item));
  };

  const assignItemToArea = (itemId: string, areaId: string) => {
    if (!activeAreas().some(area => area.id === areaId)) return;
    setItems(current => current.map(item => item.id === itemId || item.parentId === itemId ? itemSchema.parse({ ...item, areaId, updatedAt: new Date().toISOString() }) : item));
  };

  const archiveArea = (areaId: string) => {
    const now = new Date().toISOString();
    setAreas(current => current.map(area => area.id === areaId ? areaSchema.parse({ ...area, archived: true, updatedAt: now }) : area));
    setItems(current => current.map(item => item.areaId === areaId ? itemSchema.parse({ ...item, archived: true, updatedAt: now }) : item));
    if (selectedAreaId() === areaId) closeArea();
  };

  const restoreArea = (areaId: string) => setAreas(current => current.map(area => area.id === areaId ? areaSchema.parse({ ...area, archived: false, updatedAt: new Date().toISOString() }) : area));

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
    setItems(current => current.map(item => item.id === id && item.type === "Task" ? itemSchema.parse({ ...item, status: item.status === "Done" ? "Todo" : "Done", updatedAt: new Date().toISOString() }) : item));
  };

  const cyclePriority = (id: string) => setItems(current => current.map(item => item.id === id ? itemSchema.parse({ ...item, priority: item.priority === undefined ? 1 : item.priority === 1 ? 2 : item.priority === 2 ? 3 : undefined, updatedAt: new Date().toISOString() }) : item));

  const openItem = (id: string, requestedMode: "view" | "edit" = "view") => {
    const item = items().find(candidate => candidate.id === id);
    if (!item) return;
    if (isMobile()) setInboxCollapsed(true);
    updatePanelRoute({ item: id, panel: item.archived ? "archived" : requestedMode });
  };
  const openNewItem = (areaId: string | null = selectedAreaId(), parentId: string | null = null) => {
    updatePanelRoute({ panel: "create", area: areaId ?? undefined, parent: parentId ?? undefined });
  };

  const saveItem = (value: ItemFormValue) => {
    const now = new Date().toISOString();
    const currentEditingId = selectedItemId();
    const parsedForm = itemFormSchema.parse(value);
    const hasChildren = currentEditingId ? items().some(item => item.parentId === currentEditingId) : false;
    const normalized = normalizeItemFields({ ...parsedForm, parentId: !hasChildren && parsedForm.parentId && items().some(item => item.id === parsedForm.parentId && !item.parentId && item.areaId === parsedForm.areaId) ? parsedForm.parentId : null });
    if (currentEditingId) {
      const edited = items().find(item => item.id === currentEditingId);
      setItems(current => current.map(item => {
        if (item.id === currentEditingId) return itemSchema.parse({ ...item, ...normalized, updatedAt: now });
        if (item.parentId === currentEditingId && edited?.areaId !== parsedForm.areaId) return itemSchema.parse({ ...item, areaId: parsedForm.areaId, updatedAt: now });
        return item;
      }));
      setTags(current => [...new Set([...current, ...parsedForm.tags])]);
      updatePanelRoute({ item: currentEditingId, panel: "view" }, true);
      return;
    }
    const colors: Record<ItemFormValue["type"], ItemColor> = { Task: "violet", Note: "amber", Event: "green", Expense: "orange", Payment: "teal" };
    const newItem = itemSchema.parse({ id: nanoid(), workspaceId: workspace().id, color: colors[parsedForm.type], archived: false, favorite: false, createdAt: now, updatedAt: now, ...normalized });
    setItems(current => [...current, newItem]);
    setTags(current => [...new Set([...current, ...parsedForm.tags])]);
    updatePanelRoute({ item: newItem.id, panel: "view" }, true);
  };

  const closePanel = () => updatePanelRoute({});
  const changePanelMode = (mode: ItemPanelMode) => updatePanelRoute({ item: selectedItemId() ?? undefined, panel: mode, area: draftAreaId() ?? undefined, parent: draftParentId() ?? undefined }, true);
  const archiveItem = (id: string) => { setItems(current => current.map(item => item.id === id || item.parentId === id ? itemSchema.parse({ ...item, archived: true, updatedAt: new Date().toISOString() }) : item)); updatePanelRoute({ item: id, panel: "archived" }, true); };
  const restoreItem = (id: string) => { const selected = items().find(item => item.id === id); const familyId = selected?.parentId ?? id; setItems(current => current.map(item => item.id === familyId || item.parentId === familyId ? itemSchema.parse({ ...item, archived: false, updatedAt: new Date().toISOString() }) : item)); updatePanelRoute({ item: id, panel: "view" }, true); };
  const permanentlyDeleteArchivedItem = (id: string) => {
    const item = items().find(candidate => candidate.id === id);
    if (!item?.archived || !window.confirm(`Permanently delete “${item.title}”? This cannot be undone.`)) return;
    setItems(current => current.filter(candidate => candidate.id !== id && (item.parentId ? true : candidate.parentId !== id)));
    if (selectedItemId() === id) closePanel();
  };
  const toggleFavorite = (id: string) => updateItem(id, { favorite: !items().find(item => item.id === id)?.favorite });
  const archiveCompleted = () => { const completed = new Set(items().filter(item => item.type === "Task" && item.status === "Done").map(item => item.id)); setItems(current => current.map(item => completed.has(item.id) || (item.parentId ? completed.has(item.parentId) : false) ? itemSchema.parse({ ...item, archived: true, updatedAt: new Date().toISOString() }) : item)); };
  const renameWorkspace = (name: string) => setWorkspace(current => workspaceSchema.parse({ ...current, name, updatedAt: new Date().toISOString() }));
  const resetData = () => { clearState(); setWorkspace(initialWorkspace); setItems(initialItems); setAreas(initialAreas); setTags(initialTags); void routeNavigate({ to: "/areas", search: {} }); };

  return (
    <main class={["app-shell", { "detail-shell": !!selectedArea(), "panel-shell": !!panelMode(), "inspector-closed": !!selectedArea() && !panelMode(), "inbox-collapsed": inboxCollapsed() }]}> 
      <NavigationRail active={() => selectedArea() ? "areas" : activeView()} inboxCollapsed={inboxCollapsed} onToggleInbox={toggleInboxPanel} onNavigate={navigate}/>
      <InboxPanel items={inboxItems} onQuickCapture={() => setDialog("capture")} onOpenItem={openItem}/>
      <Show when={isMobile() && !inboxCollapsed()}><button class="inbox-drawer-backdrop" aria-label="Close Inbox panel" onClick={() => setInboxCollapsed(true)}/></Show>

      <Show when={selectedArea()} keyed fallback={
        <Switch fallback={<AreasPanel areas={activeAreas} viewMode={viewMode} onViewModeChange={setViewMode} onAddArea={() => setAreaEditorId("new")} onAssignItem={assignItemToArea} onOpenArea={openArea} onEditArea={setAreaEditorId} onArchiveArea={archiveArea}/>}> 
          <Match when={activeView() === "inbox"}><InboxWorkspace items={inboxItems} areas={activeAreas} onCapture={() => setDialog("capture")} onEdit={id => openItem(id, "edit")} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "areas"}><AreasPanel areas={activeAreas} viewMode={viewMode} onViewModeChange={setViewMode} onAddArea={() => setAreaEditorId("new")} onAssignItem={assignItemToArea} onOpenArea={openArea} onEditArea={setAreaEditorId} onArchiveArea={archiveArea}/></Match>
          <Match when={activeView() === "today"}><TodayWorkspace items={items} areas={activeAreas} onEdit={openItem} onToggle={toggleComplete} onCapture={() => openNewItem(null)}/></Match>
          <Match when={activeView() === "upcoming"}><UpcomingWorkspace items={items} areas={activeAreas} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "search"}><SearchWorkspace items={items} areas={activeAreas} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "tags"}><TagsWorkspace items={items} areas={activeAreas} availableTags={tags} onEdit={openItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "archive"}><ArchiveWorkspace items={items} areas={areas} onOpen={openItem} onRestore={restoreItem} onDelete={permanentlyDeleteArchivedItem}/></Match>
          <Match when={activeView() === "settings"}><SettingsWorkspace workspaceName={workspace().name} itemCount={items().length} areaCount={activeAreas().length} archivedAreas={archivedAreas} saveMessage={saveMessage()} onRenameWorkspace={renameWorkspace} onRestoreArea={restoreArea} onReset={resetData} onArchiveCompleted={archiveCompleted}/></Match>
        </Switch>
      }>
        {area => <AreaWorkspace area={area} items={areaItems} selectedId={selectedItemId} onBack={closeArea} onNewItem={() => openNewItem(area.id)} onEditArea={() => setAreaEditorId(area.id)} onSelectItem={openItem} onToggleComplete={toggleComplete} onCyclePriority={cyclePriority}/>} 
      </Show>

      <Show when={panelMode()} keyed>
        {mode => <ItemInspector mode={mode} item={selectedItem()} areas={activeAreas()} children={selectedChildren()} possibleParents={possibleParents()} availableTags={tags()} initialAreaId={draftAreaId()} initialParentId={draftParentId()} onClose={closePanel} onModeChange={changePanelMode} onSave={saveItem} onArchive={() => selectedItemId() && archiveItem(selectedItemId()!)} onRestore={() => selectedItemId() && restoreItem(selectedItemId()!)} onToggleFavorite={() => selectedItemId() && toggleFavorite(selectedItemId()!)} onOpenItem={openItem} onAddChild={() => openNewItem(selectedItem()?.areaId ?? null, selectedItemId())}/>} 
      </Show>

      <CaptureDialog mode={dialog} onClose={() => setDialog(null)} onCaptureItem={captureItem}/>
      <AreaDialog area={areas().find(area => area.id === areaEditorId()) ?? null} open={areaEditorId() !== null} onClose={() => setAreaEditorId(null)} onSave={saveArea}/>
    </main>
  );
}

export default App;
