import "./App.css";
import React, { useEffect, useRef, useState } from "react";

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [theme, setTheme] = useState("light");
  const [priority, setPriority] = useState("medium");
  const [dueInput, setDueInput] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | completed
  const [sortBy, setSortBy] = useState("created"); // created | due | priority
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDue, setEditDue] = useState("");
  const [error, setError] = useState("");
  const [removingIds, setRemovingIds] = useState([]);
  const inputRef = useRef(null);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  // Autofocus main input on mount and after theme change
  useEffect(() => {
    inputRef.current?.focus();
  }, [theme]);

  // Load todos from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("todos");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTodos(parsed);
      }
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
    } catch {}
  }, []);

  // Save todos and theme
  useEffect(() => {
    try {
      localStorage.setItem("todos", JSON.stringify(todos));
      localStorage.setItem("theme", theme);
    } catch {}
  }, [todos, theme]);

  // Request notification permission and check due reminders
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!("Notification" in window)) return;
    const timer = setInterval(() => {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      let changed = false;
      const updated = todos.map((t) => {
        if (t.isCompleted || t.notified || !t.dueAt) return t;
        const dueMs = new Date(t.dueAt).getTime();
        if (!isNaN(dueMs) && dueMs <= now) {
          try {
            new Notification("Task due", { body: `${t.text}` });
          } catch {}
          changed = true;
          return { ...t, notified: true };
        }
        return t;
      });
      if (changed) setTodos(updated);
    }, 30000);
    return () => clearInterval(timer);
  }, [todos]);

  const handleAddTodo = () => {
    if (inputValue.trim() === "") {
      setError("Task title cannot be empty.");
      return;
    }
    if (dueInput) {
      const dueMs = new Date(dueInput).getTime();
      if (isNaN(dueMs)) {
        setError("Please provide a valid due date.");
        return;
      }
      if (dueMs < Date.now()) {
        setError("Due date must be in the future.");
        return;
      }
    }
    const newTodo = {
      id: Date.now(),
      text: inputValue,
      isCompleted: false,
      priority,
      dueAt: dueInput ? new Date(dueInput).toISOString() : "",
      createdAt: Date.now(),
      notified: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue("");
    setPriority("medium");
    setDueInput("");
    setError("");
    inputRef.current?.focus();
  };

  const handleToggleComplete = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
  };

  const handleDeleteTodo = (id) => {
    setRemovingIds((prev) => [...new Set([...prev, id])]);
    setTimeout(() => {
      setTodos((t) => t.filter((todo) => todo.id !== id));
      setRemovingIds((prev) => prev.filter((x) => x !== id));
    }, 200);
  };

  const startEdit = (todo) => {
    setEditId(todo.id);
    setEditText(todo.text);
    setEditPriority(todo.priority || "medium");
    setEditDue(todo.dueAt ? new Date(todo.dueAt).toISOString().slice(0, 16) : "");
  };

  const saveEdit = () => {
    if (!editId) return;
    if (editText.trim() === "") {
      setError("Task title cannot be empty.");
      return;
    }
    if (editDue) {
      const dueMs = new Date(editDue).getTime();
      if (isNaN(dueMs)) {
        setError("Please provide a valid due date.");
        return;
      }
      if (dueMs < Date.now()) {
        setError("Due date must be in the future.");
        return;
      }
    }
    setTodos(
      todos.map((t) =>
        t.id === editId
          ? {
              ...t,
              text: editText.trim() ? editText : t.text,
              priority: editPriority,
              dueAt: editDue ? new Date(editDue).toISOString() : "",
              notified: false,
            }
          : t
      )
    );
    setEditId(null);
    setEditText("");
    setEditPriority("medium");
    setEditDue("");
    setError("");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditText("");
    setEditPriority("medium");
    setEditDue("");
    inputRef.current?.focus();
  };

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.isCompleted;
    if (filter === "completed") return !!t.isCompleted;
    return true;
  });

  const priorityRank = { high: 0, medium: 1, low: 2 };
  const visibleTodos = [...filtered].sort((a, b) => {
    if (sortBy === "due") {
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return ad - bd;
    }
    if (sortBy === "priority") {
      return (priorityRank[a.priority || "medium"] ?? 1) - (priorityRank[b.priority || "medium"] ?? 1);
    }
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
  return (
    <div className={`app ${theme}`}>
      <header className="app-header">
        <h1>Todo List 📝</h1>
        <button className="theme-switcher" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </header>

      <main className="todo-container">
        {error && (
          <div className="alert error" role="alert">
            <span>{error}</span>
            <button
              className="alert-close"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}
        <div className="controls-row">
          <div className="input-container">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add a new task... ✍️"
              ref={inputRef}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTodo();
              }}
            />
            <select
              className="priority-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <input
              type="datetime-local"
              className="due-input"
              value={dueInput}
              onChange={(e) => setDueInput(e.target.value)}
            />
            <button onClick={handleAddTodo}>Add ➕</button>
          </div>
        </div>

        <div className="filters">
          <div className="filter-group">
            <button className={`filter-btn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All</button>
            <button className={`filter-btn ${filter === "active" ? "active" : ""}`} onClick={() => setFilter("active")}>Active</button>
            <button className={`filter-btn ${filter === "completed" ? "active" : ""}`} onClick={() => setFilter("completed")}>Completed</button>
          </div>
          <div className="sort-group">
            <label htmlFor="sort">Sort:</label>
            <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created">Created</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        <div className="todo-list">
          <ul className="todo-list">
            {visibleTodos.map((todo) => (
              <li
                key={todo.id}
                className={`${todo.isCompleted ? "completed" : ""} ${removingIds.includes(todo.id) ? "removing" : ""}`}
              >
                {editId === todo.id ? (
                  <>
                    <input
                      className="edit-input"
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <select
                      className="priority-select"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <input
                      type="datetime-local"
                      className="due-input"
                      value={editDue}
                      onChange={(e) => setEditDue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <button onClick={saveEdit}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span
                      onDoubleClick={() => handleToggleComplete(todo.id)}
                      style={{ cursor: "pointer" }}
                      title="Double-click to toggle complete"
                    >
                      {todo.isCompleted ? "✅ " : "🕒 "}
                      {todo.text}
                    </span>
                    <div className="todo-meta">
                      <span className={`badge badge-priority ${todo.priority}`}>
                        {todo.priority}
                      </span>
                      {todo.dueAt && (
                        <span className="due-chip">
                          {new Date(todo.dueAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="actions">
                      <button onClick={() => startEdit(todo)}>Edit</button>
                      <button onClick={() => handleDeleteTodo(todo.id)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </main>

      <footer className="app-footer">
        <small>Double-click a task to toggle complete</small>
      </footer>
    </div>
  );
}

export default App;
