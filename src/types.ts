export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;
  assignee: string;
  projectId: number;
}

export interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
}
