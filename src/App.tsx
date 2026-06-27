import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

import { createTask, deleteTask, listTasks, updateTaskStatus } from "./api/tasks";
import { SpecPanel } from "./components/SpecPanel";
import { TaskPanel } from "./components/TaskPanel";
import { TitleBar } from "./components/TitleBar";
import { ApiState, Task } from "./types";

const STORAGE_KEY = "basic-overlay-state";

export function App() {
  const [apiState, setApiState] = useState<ApiState>("connecting");
  const [clickThrough, setClickThrough] = useState(false);
  const [draftTask, setDraftTask] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [spec, setSpec] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const state = JSON.parse(raw) as { spec?: string };
      setSpec(typeof state.spec === "string" ? state.spec : "");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ spec }));
  }, [spec]);

  useEffect(() => {
    let cancelled = false;

    listTasks()
      .then((apiTasks) => {
        if (cancelled) return;
        setTasks(apiTasks);
        setApiState("online");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setApiState("offline");
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done").length,
    [tasks],
  );

  async function addTask(event: FormEvent) {
    event.preventDefault();
    const title = draftTask.trim();
    const description = draftDescription.trim();
    if (!title) return;

    try {
      const task = await createTask(title, description || undefined);
      setTasks((current) => [task, ...current]);
      setApiState("online");
      setDraftTask("");
      setDraftDescription("");
    } catch (error) {
      console.error(error);
      setApiState("offline");
    }
  }

  async function hideOverlay() {
    await invoke("hide_overlay");
  }

  async function removeTask(taskId: number) {
    try {
      await deleteTask(taskId);
      setTasks((current) => current.filter((task) => task.id !== taskId));
      setApiState("online");
    } catch (error) {
      console.error(error);
      setApiState("offline");
    }
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

  async function toggleClickThrough() {
    try {
      await invoke("toggle_click_through");
    } catch (error) {
      console.error(error);
    }
  }

  async function toggleTask(task: Task) {
    const nextStatus = task.status === "done" ? "todo" : "done";

    try {
      const updatedTask = await updateTaskStatus(task, nextStatus);
      setTasks((current) =>
        current.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask,
        ),
      );
      setApiState("online");
    } catch (error) {
      console.error(error);
      setApiState("offline");
    }
  }

  return (
    <main className={clickThrough ? "overlay-shell click-through" : "overlay-shell"}>
      <TitleBar
        apiState={apiState}
        clickThrough={clickThrough}
        openTasks={openTasks}
        onDragStart={startWindowDrag}
        onHide={hideOverlay}
        onToggleClickThrough={toggleClickThrough}
      />
      <TaskPanel
        apiState={apiState}
        draftTask={draftTask}
        draftDescription={draftDescription}
        onDraftDescriptionChange={setDraftDescription}
        tasks={tasks}
        onAddTask={addTask}
        onDraftTaskChange={setDraftTask}
        onRemoveTask={removeTask}
        onToggleTask={toggleTask}
      />
      <SpecPanel spec={spec} onSpecChange={setSpec} />
    </main>
  );
}
