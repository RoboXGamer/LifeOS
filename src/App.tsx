import { createSignal, For } from "solid-js";
import "./App.css";
import { nanoid } from "nanoid";

type Item = {
  id: string;
  text: string;
  areaId: string | null;
  createdAt: string;
  updatedAt: string;
};

function App() {
  const [items, setItems] = createSignal<Item[]>([]);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const text = new FormData(form).get("item")?.toString() ?? "";
    if (!text) return;
    const currentItem = { text, id: nanoid(), areaId: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setItems([...items(), currentItem]);
    form.reset();
  };

  const onDelete = (id: string) => {
    setItems(items().filter((t) => t.id !== id));
  };

  return (
    <>
      <main class="center">
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
        <hr />
        <Inbox items={items} onDelete={onDelete} />
      </main>
    </>
  );
}

function Inbox(props: { items: () => Item[]; onDelete: (id: string) => void }) {
  const [inboxItems] = createSignal(() => props.items().filter((item) => item.areaId === null));

  return (
    <section id="item-list-container">
      <ol>
        <For each={inboxItems()} keyed={(t) => t.id}>
          {(item, index) => (
            <li>
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

export default App;
