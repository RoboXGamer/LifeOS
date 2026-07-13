import { createSignal, For } from "solid-js";
import "./App.css";
import { nanoid } from "nanoid";

type Todo = {
  id: string;
  text: string;
};

function App() {
  const [todos, setTodos] = createSignal<Todo[]>([]);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const todo = new FormData(form).get("todo")?.toString() ?? "";
    if (!todo) return;
    const currentTodo = { text: todo, id: nanoid() };
    setTodos([...todos(), currentTodo]);
    form.reset();
  };

  const onDelete = (id: string) => {
    setTodos(todos().filter((t) => t.id !== id));
  };

  return (
    <>
      <main class="center">
        <section id="todo-form-container">
          <form onSubmit={onSubmit}>
            <input
              autocomplete="off"
              id="todo"
              name="todo"
              type="text"
              placeholder="What needs to be done?"
            />
            <button type="submit">Add Todo</button>
          </form>
        </section>
        <hr />
        <section id="todo-list-container">
          <ol>
            <For each={todos()} keyed={(t) => t.id}>
              {(todo, index) => (
                <li>
                  <span>
                    {`${index() + 1}. `}
                    {todo().text}
                  </span>
                  <button onClick={() => onDelete(todo().id)}>Delete</button>
                </li>
              )}
            </For>
          </ol>
        </section>
      </main>
    </>
  );
}

export default App;
