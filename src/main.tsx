import React, { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Check,
  Circle,
  Eye,
  EyeOff,
  Grip,
  ListPlus,
  MousePointer2,
  MousePointerClick,
  Pin,
  Trash2,
} from "lucide-react";
import "./styles.css";

type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

const STORAGE_KEY = "basic-overlay-state";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draftTask, setDraftTask] = useState("");
  const [spec, setSpec] = useState("");
  const [clickThrough, setClickThrough] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const state = JSON.parse(raw) as { tasks?: Task[]; spec?: string };
      setTasks(Array.isArray(state.tasks) ? state.tasks : []);
      setSpec(typeof state.spec === "string" ? state.spec : "");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks, spec }));
  }, [tasks, spec]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    // Native shortcuts and tray actions can change click-through without a
    // browser click, so React listens for Rust state updates.
    listen<{ enabled: boolean }>("overlay://click-through-changed", (event) => {
      setClickThrough(event.payload.enabled);
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const openTasks = useMemo(() => tasks.filter((task) => !task.done).length, [tasks]);

  async function toggleClickThrough() {
    try {
      await invoke("toggle_click_through");
    } catch (error) {
      console.error(error);
    }
  }

  async function hideOverlay() {
    await invoke("hide_overlay");
  }

  async function startWindowDrag(event: MouseEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();

    // Native drag is more reliable than data-tauri-drag-region inside WebView2.
    try {
      await invoke("start_window_drag");
    } catch (error) {
      console.error(error);
    }
  }

  function addTask(event: FormEvent) {
    event.preventDefault();
    const title = draftTask.trim();
    if (!title) return;

    setTasks((current) => [
      { id: createId(), title, done: false, createdAt: Date.now() },
      ...current,
    ]);
    setDraftTask("");
  }

  function toggleTask(id: string) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  function removeTask(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <main className={clickThrough ? "overlay-shell click-through" : "overlay-shell"}>
      <header className="titlebar">
        <button
          className="drag-handle"
          type="button"
          onMouseDown={startWindowDrag}
          title="Move overlay"
          aria-label="Move overlay"
        >
          <Grip size={18} aria-hidden="true" />
        </button>
        <div className="identity">
          <span className="app-name">Basic Overlay</span>
          <span className="status">{openTasks} open</span>
        </div>
        <div className="window-actions">
          <div className={clickThrough ? "click-mode enabled" : "click-mode"}>
            <button
              className={clickThrough ? "icon-button active" : "icon-button"}
              type="button"
              onClick={toggleClickThrough}
              title="Toggle click-through (Alt+Shift+C)"
              aria-label="Toggle click-through"
            >
              {clickThrough ? <MousePointerClick size={18} /> : <MousePointer2 size={18} />}
            </button>
            <div className="click-mode-copy" aria-live="polite">
              <span>{clickThrough ? "ON" : "OFF"}</span>
              <kbd>Alt Shift C</kbd>
            </div>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={hideOverlay}
            title="Hide overlay"
            aria-label="Hide overlay"
          >
            {clickThrough ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>

      <section className="task-panel" aria-label="Task list">
        <form className="task-form" onSubmit={addTask}>
          <input
            value={draftTask}
            onChange={(event) => setDraftTask(event.target.value)}
            placeholder="Next task"
            aria-label="Next task"
          />
          <button type="submit" aria-label="Add task" title="Add task">
            <ListPlus size={18} />
          </button>
        </form>

        <div className="tasks">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <Pin size={18} />
              <span>Add tasks for the current work session.</span>
            </div>
          ) : (
            tasks.map((task) => (
              <article className={task.done ? "task done" : "task"} key={task.id}>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={task.done ? "Mark task open" : "Mark task done"}
                  title={task.done ? "Mark open" : "Mark done"}
                >
                  {task.done ? <Check size={16} /> : <Circle size={16} />}
                </button>
                <span>{task.title}</span>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => removeTask(task.id)}
                  aria-label="Remove task"
                  title="Remove task"
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="spec-panel" aria-label="Live spec">
        <div className="section-heading">
          <span>Live Spec</span>
          <small>Alt+Shift+Space / Alt+Shift+C</small>
        </div>
        <textarea
          value={spec}
          onChange={(event) => setSpec(event.target.value)}
          placeholder="Write acceptance notes, UI details, edge cases..."
          aria-label="Live spec notes"
        />
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
