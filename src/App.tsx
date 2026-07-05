import { createSignal, For } from "solid-js";
import "./App.css";
import { nanoid } from "nanoid";

type Todo = {
  id: string;
  text: string;
};

function App() {
  const [todo, setTodo] = createSignal<string>("");
  const [todos, setTodos] = createSignal<Todo[]>([]);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    const currentTodo = { text: todo(), id: nanoid() };
    console.log(currentTodo);
    setTodos([...todos(), currentTodo]);
    setTodo("");
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
              type="text"
              value={todo()}
              placeholder="What needs to be done?"
              onInput={(e) => setTodo(e.currentTarget.value)}
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
