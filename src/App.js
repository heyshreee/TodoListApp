import "./App.css";
import React, { useState } from "react";

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleAddTodo = () => {
    if (inputValue.trim() === "") return;
    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue("");
  };

  const handleToggleComplete = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };
  return (
    <div className={`app ${theme}`}> 
      <div className="todo-container">
        <button className="theme-switcher" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <h1>Todo List 📝</h1>

        <div className="input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a new task... ✍️"
          />
          <button onClick={handleAddTodo}>Add ➕</button>
        </div>

        <div className="todo-list">
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className={todo.isCompleted ? "completed" : ""}>
                <span
                  onDoubleClick={() => handleToggleComplete(todo.id)}
                  style={{ cursor: "pointer" }}
                  title="Double-click to toggle complete"
                >
                  {todo.isCompleted ? "✅ " : "🕒 "}
                  {todo.text}
                </span>
                <button onClick={() => handleDeleteTodo(todo.id)}>
                  🗑️ Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
