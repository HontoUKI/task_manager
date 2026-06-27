import { FormEvent } from "react";
import { Check, Circle, ListPlus, Pin, Trash2 } from "lucide-react";

import { ApiState, Task } from "../types";

type TaskPanelProps = {
  apiState: ApiState;
  draftTask: string;
  tasks: Task[];
  onDraftTaskChange: (value: string) => void;
  onAddTask: (event: FormEvent) => void;
  onRemoveTask: (taskId: number) => void;
  onToggleTask: (task: Task) => void;
};

export function TaskPanel({
  apiState,
  draftTask,
  tasks,
  onDraftTaskChange,
  onAddTask,
  onRemoveTask,
  onToggleTask,
}: TaskPanelProps) {
  return (
    <section className="task-panel" aria-label="Task list">
      <form className="task-form" onSubmit={onAddTask}>
        <input
          value={draftTask}
          onChange={(event) => onDraftTaskChange(event.target.value)}
          placeholder={apiState === "offline" ? "Backend offline" : "Next task"}
          aria-label="Next task"
          disabled={apiState === "offline"}
        />
        <button
          type="submit"
          aria-label="Add task"
          title="Add task"
          disabled={apiState === "offline"}
        >
          <ListPlus size={18} />
        </button>
      </form>

      <div className="tasks">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <Pin size={18} />
            <span>
              {apiState === "offline"
                ? "Start the sub-module API to sync tasks."
                : "Add tasks for the current work session."}
            </span>
          </div>
        ) : (
          tasks.map((task) => {
            const done = task.status === "done";

            return (
              <article className={done ? "task done" : "task"} key={task.id}>
                <button
                  className="check-button"
                  type="button"
                  onClick={() => onToggleTask(task)}
                  aria-label={done ? "Mark task open" : "Mark task done"}
                  title={done ? "Mark open" : "Mark done"}
                >
                  {done ? <Check size={16} /> : <Circle size={16} />}
                </button>
                <span>{task.title}</span>
                <button
                  className="delete-button"
                  type="button"
                  onClick={() => onRemoveTask(task.id)}
                  aria-label="Remove task"
                  title="Remove task"
                >
                  <Trash2 size={15} />
                </button>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
