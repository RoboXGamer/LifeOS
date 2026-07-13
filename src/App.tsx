import { Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { nanoid } from "nanoid";
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

function App() {
  const initialState = loadState({ items: initialItems, areas: initialAreas });
  const [items, setItems] = createSignal<Item[]>(initialState.items);
  const [areas, setAreas] = createSignal<Area[]>(initialState.areas);
  const [activeView, setActiveView] = createSignal<AppView>("areas");
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [dialog, setDialog] = createSignal<"capture" | "area" | null>(null);
  const [selectedAreaId, setSelectedAreaId] = createSignal<string | null>(null);
  const [selectedItemId, setSelectedItemId] = createSignal<string | null>(null);
  const [panelMode, setPanelMode] = createSignal<ItemPanelMode | null>(null);
  const [draftAreaId, setDraftAreaId] = createSignal<string | null>(null);
  const [draftParentId, setDraftParentId] = createSignal<string | null>(null);

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
    setSelectedAreaId(null);
    setSelectedItemId(null);
    setPanelMode(null);
    setActiveView(view);
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
    setActiveView("areas");
    setSelectedAreaId(areaId);
    const firstItem = items().find(item => item.areaId === areaId && !item.parentId && !item.archived);
    setSelectedItemId(firstItem?.id ?? null);
    setPanelMode(firstItem ? "view" : null);
  };

  const closeArea = () => { setSelectedAreaId(null); setSelectedItemId(null); setPanelMode(null); };

  const toggleComplete = (id: string) => {
    setItems(current => current.map(item => item.id === id && item.type === "Task" ? { ...item, status: item.status === "Done" ? "Todo" : "Done", updatedAt: new Date().toISOString() } : item));
  };

  const openItem = (id: string) => {
    const item = items().find(candidate => candidate.id === id);
    if (!item) return;
    setSelectedItemId(id);
    setDraftAreaId(item.areaId);
    setDraftParentId(item.parentId ?? null);
    setPanelMode(item.archived ? "archived" : "view");
  };
  const openNewItem = (areaId: string | null = selectedAreaId(), parentId: string | null = null) => {
    setSelectedItemId(null);
    setDraftAreaId(areaId);
    setDraftParentId(parentId);
    setPanelMode("create");
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
      setPanelMode("view");
      return;
    }
    const colors: Record<ItemFormValue["type"], ItemColor> = { Task: "violet", Note: "amber", Event: "green", Expense: "orange", Payment: "teal" };
    const newItem: Item = { id: nanoid(), icon: itemTypeIcon(value.type), color: colors[value.type], archived: false, createdAt: now, updatedAt: now, ...normalized };
    setItems(current => [...current, newItem]);
    setSelectedItemId(newItem.id);
    setPanelMode("view");
  };

  const closePanel = () => { setSelectedItemId(null); setPanelMode(null); };
  const archiveItem = (id: string) => { updateItem(id, { archived: true }); setPanelMode("archived"); };
  const restoreItem = (id: string) => { updateItem(id, { archived: false }); setPanelMode("view"); };
  const deleteItem = (id: string) => { if (!window.confirm("Permanently delete this item and its child items?")) return; setItems(current => current.filter(item => item.id !== id && item.parentId !== id)); closePanel(); };
  const toggleFavorite = (id: string) => updateItem(id, { favorite: !items().find(item => item.id === id)?.favorite });
  const archiveCompleted = () => setItems(current => current.map(item => item.type === "Task" && item.status === "Done" ? { ...item, archived: true, updatedAt: new Date().toISOString() } : item));
  const resetData = () => { clearState(); setItems(initialItems); setAreas(initialAreas); setSelectedAreaId(null); closePanel(); setActiveView("areas"); };

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
        {mode => <ItemInspector mode={mode} item={selectedItem()} areas={areas()} children={selectedChildren()} possibleParents={possibleParents()} initialAreaId={draftAreaId()} initialParentId={draftParentId()} onClose={closePanel} onModeChange={setPanelMode} onSave={saveItem} onArchive={() => selectedItemId() && archiveItem(selectedItemId()!)} onRestore={() => selectedItemId() && restoreItem(selectedItemId()!)} onDelete={() => selectedItemId() && deleteItem(selectedItemId()!)} onToggleFavorite={() => selectedItemId() && toggleFavorite(selectedItemId()!)} onOpenItem={openItem} onAddChild={() => openNewItem(selectedItem()?.areaId ?? null, selectedItemId())}/>} 
      </Show>

      <CaptureDialog mode={dialog} onClose={() => setDialog(null)} onCaptureItem={captureItem} onAddArea={addArea}/>
    </main>
  );
}

export default App;
