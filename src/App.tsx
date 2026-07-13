import { createSignal, For, createEffect } from "solid-js";
import "./App.css";
import { nanoid } from "nanoid";

type Item = {
  id: string;
  text: string;
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Area = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

function App() {
  const [items, setItems] = createSignal<Item[]>([]);

  createEffect(
    () => [items()],
    () => {
      console.log(items());
    },
  );

  const assignItemToArea = (itemId: string, areaId: string) => {
    setItems(
      items().map((item) =>
        item.id === itemId
          ? { ...item, areaId, updatedAt: new Date().toISOString() }
          : item,
      ),
    );
  };

  return (
    <main class="split">
      <InboxSection items={items} setItems={setItems} />
      <AreaSection onAssignItemToArea={assignItemToArea} />
    </main>
  );
}

function InboxSection(props: {
  items: () => Item[];
  setItems: (items: Item[]) => void;
}) {
  const onSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const text = new FormData(form).get("item")?.toString() ?? "";
    if (!text) return;
    const currentItem = {
      text,
      id: nanoid(),
      areaId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    props.setItems([...props.items(), currentItem]);
    form.reset();
  };

  const onDelete = (id: string) => {
    props.setItems(props.items().filter((t) => t.id !== id));
  };

  return (
    <section class="column">
      <section id="item-form-container">
        <form onSubmit={onSubmit}>
          <input
            autocomplete="off"
            id="item"
            name="item"
            type="text"
            placeholder="What needs to be done?"
          />
          <button type="submit">Add Item</button>
        </form>
      </section>
      <Inbox items={props.items} onDelete={onDelete} />
    </section>
  );
}

function Inbox(props: { items: () => Item[]; onDelete: (id: string) => void }) {
  const [inboxItems] = createSignal(() =>
    props.items().filter((item) => item.areaId === null),
  );

  return (
    <section id="item-list-container">
      <ol>
        <For each={inboxItems()} keyed={(t) => t.id}>
          {(item, index) => (
            <li
              draggable="true"
              onDragStart={(e) =>
                e.dataTransfer?.setData("text/plain", item().id)
              }
            >
              <span>
                {`${index() + 1}. `}
                {item().text}
              </span>
              <button onClick={() => props.onDelete(item().id)}>Delete</button>
            </li>
          )}
        </For>
      </ol>
    </section>
  );
}

function AreaSection(props: {
  onAssignItemToArea: (itemId: string, areaId: string) => void;
}) {
  const [areas, setAreas] = createSignal<Area[]>([]);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const name = new FormData(form).get("area")?.toString() ?? "";
    if (!name) return;
    const currentArea = {
      name,
      id: nanoid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAreas([...areas(), currentArea]);
    form.reset();
  };

  const onDelete = (id: string) => {
    setAreas(areas().filter((a) => a.id !== id));
  };

  return (
    <section class="column">
      <section id="area-form-container">
        <form onSubmit={onSubmit}>
          <input
            autocomplete="off"
            id="area"
            name="area"
            type="text"
            placeholder="Area name"
          />
          <button type="submit">Add Area</button>
        </form>
      </section>
      <section id="area-list-container">
        <ol>
          <For each={areas()} keyed={(a) => a.id}>
            {(area, index) => (
              <li
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => {
                  const li = e.currentTarget;
                  const c = +(li.dataset.dragCounter ?? 0) + 1;
                  li.dataset.dragCounter = String(c);
                  li.classList.add("drag-over");
                }}
                onDragLeave={(e) => {
                  const li = e.currentTarget;
                  const c = +(li.dataset.dragCounter ?? 0) - 1;
                  li.dataset.dragCounter = String(c);
                  if (c <= 0) li.classList.remove("drag-over");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const li = e.currentTarget;
                  li.dataset.dragCounter = "0";
                  li.classList.remove("drag-over");
                  const itemId = e.dataTransfer?.getData("text/plain") ?? "";
                  if (itemId) props.onAssignItemToArea(itemId, area().id);
                }}
              >
                <span>
                  {`${index() + 1}. `}
                  {area().name}
                </span>
                <button onClick={() => onDelete(area().id)}>Delete</button>
              </li>
            )}
          </For>
        </ol>
      </section>
    </section>
  );
}

export default App;
