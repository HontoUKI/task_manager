export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiState = "connecting" | "online" | "offline";
