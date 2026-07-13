import { Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { nanoid } from "nanoid";
import "./App.css";
import { AreasPanel } from "./components/AreasPanel";
import { AreaWorkspace, itemTypeIcon } from "./components/AreaWorkspace";
import { CaptureDialog } from "./components/CaptureDialog";
import { InboxPanel } from "./components/InboxPanel";
import { ItemDialog, type ItemFormValue } from "./components/ItemDialog";
import { ItemInspector } from "./components/ItemInspector";
import { NavigationRail } from "./components/NavigationRail";
import { ArchiveWorkspace, InboxWorkspace, SearchWorkspace, SettingsWorkspace, TagsWorkspace, TodayWorkspace, UpcomingWorkspace } from "./components/V1Screens";
import { initialAreas, initialItems } from "./data/seed";
import { clearState, loadState, saveState } from "./data/storage";
import type { AppView, Area, Item, ItemColor, ItemViewMode, ViewMode } from "./types";

function App() {
  const initialState = loadState({ items: initialItems, areas: initialAreas });
  const [items, setItems] = createSignal<Item[]>(initialState.items);
  const [areas, setAreas] = createSignal<Area[]>(initialState.areas);
  const [activeView, setActiveView] = createSignal<AppView>("areas");
  const [viewMode, setViewMode] = createSignal<ViewMode>("grid");
  const [itemView, setItemView] = createSignal<ItemViewMode>("list");
  const [dialog, setDialog] = createSignal<"capture" | "area" | null>(null);
  const [selectedAreaId, setSelectedAreaId] = createSignal<string | null>(null);
  const [selectedItemId, setSelectedItemId] = createSignal<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = createSignal(false);
  const [editingItemId, setEditingItemId] = createSignal<string | null>(null);

  createEffect(
    () => ({ items: items(), areas: areas() }),
    state => saveState(state)
  );

  const inboxItems = () => items().filter(item => item.areaId === null && !item.archived);
  const selectedArea = () => areas().find(area => area.id === selectedAreaId()) ?? null;
  const areaItems = () => items().filter(item => item.areaId === selectedAreaId());
  const selectedItem = () => items().find(item => item.id === selectedItemId()) ?? null;
  const editingItem = () => items().find(item => item.id === editingItemId()) ?? null;

  const navigate = (view: AppView) => {
    setSelectedAreaId(null);
    setSelectedItemId(null);
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
  };

  const closeArea = () => { setSelectedAreaId(null); setSelectedItemId(null); };

  const toggleComplete = (id: string) => {
    setItems(current => current.map(item => item.id === id && item.type === "Task" ? { ...item, status: item.status === "Done" ? "Todo" : "Done", updatedAt: new Date().toISOString() } : item));
  };

  const openNewItem = () => { setEditingItemId(null); setItemDialogOpen(true); };
  const openEditItem = (id = selectedItemId()) => { setEditingItemId(id); setItemDialogOpen(true); };

  const saveItem = (value: ItemFormValue) => {
    const now = new Date().toISOString();
    const currentEditingId = editingItemId();
    if (currentEditingId) {
      setItems(current => current.map(item => item.id === currentEditingId ? { ...item, ...value, icon: itemTypeIcon(value.type), updatedAt: now } : item));
      return;
    }
    const colors: Record<ItemFormValue["type"], ItemColor> = { Task: "violet", Note: "amber", Event: "green", Expense: "orange", Payment: "teal" };
    const newItem: Item = { id: nanoid(), areaId: selectedAreaId(), icon: itemTypeIcon(value.type), color: colors[value.type], parentId: null, archived: false, createdAt: now, updatedAt: now, ...value, isSettled: value.type === "Payment" ? true : value.type === "Expense" ? false : undefined };
    setItems(current => [...current, newItem]);
    setSelectedItemId(newItem.id);
  };

  const archiveItem = (id: string) => { updateItem(id, { archived: true }); if (selectedItemId() === id) setSelectedItemId(null); };
  const restoreItem = (id: string) => updateItem(id, { archived: false });
  const deleteItem = (id: string) => { setItems(current => current.filter(item => item.id !== id && item.parentId !== id)); if (selectedItemId() === id) setSelectedItemId(null); };
  const toggleFavorite = (id: string) => updateItem(id, { favorite: !items().find(item => item.id === id)?.favorite });
  const archiveCompleted = () => setItems(current => current.map(item => item.type === "Task" && item.status === "Done" ? { ...item, archived: true, updatedAt: new Date().toISOString() } : item));
  const resetData = () => { clearState(); setItems(initialItems); setAreas(initialAreas); setSelectedAreaId(null); setSelectedItemId(null); setActiveView("areas"); };

  return (
    <main class={["app-shell", { "detail-shell": !!selectedArea(), "inspector-closed": !!selectedArea() && !selectedItem() }]}>
      <NavigationRail active={() => selectedArea() ? "areas" : activeView()} onNavigate={navigate}/>
      <InboxPanel items={inboxItems} onQuickCapture={() => setDialog("capture")}/>

      <Show when={selectedArea()} keyed fallback={
        <Switch fallback={<AreasPanel areas={areas} viewMode={viewMode} onViewModeChange={setViewMode} onAddArea={() => setDialog("area")} onAssignItem={assignItemToArea} onOpenArea={openArea}/>}>
          <Match when={activeView() === "inbox"}><InboxWorkspace items={inboxItems} areas={areas} onCapture={() => setDialog("capture")} onUpdate={updateItem} onEdit={openEditItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "areas"}><AreasPanel areas={areas} viewMode={viewMode} onViewModeChange={setViewMode} onAddArea={() => setDialog("area")} onAssignItem={assignItemToArea} onOpenArea={openArea}/></Match>
          <Match when={activeView() === "today"}><TodayWorkspace items={items} areas={areas} onEdit={openEditItem} onToggle={toggleComplete} onCapture={() => setDialog("capture")}/></Match>
          <Match when={activeView() === "upcoming"}><UpcomingWorkspace items={items} areas={areas} onEdit={openEditItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "search"}><SearchWorkspace items={items} areas={areas} onEdit={openEditItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "tags"}><TagsWorkspace items={items} areas={areas} onEdit={openEditItem} onToggle={toggleComplete}/></Match>
          <Match when={activeView() === "archive"}><ArchiveWorkspace items={items} areas={areas} onRestore={restoreItem} onDelete={deleteItem}/></Match>
          <Match when={activeView() === "settings"}><SettingsWorkspace itemCount={items().length} areaCount={areas().length} onReset={resetData} onArchiveCompleted={archiveCompleted}/></Match>
        </Switch>
      }>
        {area => <AreaWorkspace area={area} items={areaItems} selectedId={selectedItemId} itemView={itemView} onItemViewChange={setItemView} onBack={closeArea} onNewItem={openNewItem} onSelectItem={setSelectedItemId} onToggleComplete={toggleComplete}/>} 
      </Show>

      <Show when={selectedItem()} keyed>
        {item => <ItemInspector item={item} area={selectedArea()!} childCount={items().filter(candidate => candidate.parentId === item.id).length} onClose={() => setSelectedItemId(null)} onEdit={() => openEditItem(item.id)} onArchive={() => archiveItem(item.id)} onDelete={() => deleteItem(item.id)} onToggleFavorite={() => toggleFavorite(item.id)} onOpenChildren={() => { const child = items().find(candidate => candidate.parentId === item.id); if (child) setSelectedItemId(child.id); }}/>} 
      </Show>

      <CaptureDialog mode={dialog} onClose={() => setDialog(null)} onCaptureItem={captureItem} onAddArea={addArea}/>
      <ItemDialog open={itemDialogOpen} item={editingItem} onClose={() => setItemDialogOpen(false)} onSave={saveItem}/>
    </main>
  );
}

export default App;
