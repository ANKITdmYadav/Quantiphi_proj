import type { Task, TaskStatus, Priority, ProjectMember } from "./types";

/**
 * API contract for the FastAPI backend:
 * GET    /projects/{projectId}/tasks
 * POST   /projects/{projectId}/tasks
 * PATCH  /tasks/{taskId}
 * DELETE /tasks/{taskId}
 * GET    /projects/{projectId}/members
 * POST   /projects/{projectId}/members
 *
 * Suggested task JSON fields: id, title, description, status, priority,
 * due_date, assignee_id / assignee, project_id.
 * Adapt mapping here to match your actual backend response schemas.
 */
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");
const USE_API = import.meta.env.VITE_USE_API === "true";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init
  });
  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `API request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  enabled: USE_API,
  async listTasks(projectId: number): Promise<Task[]> {
    return request<Task[]>(`/projects/${projectId}/tasks`);
  },
  async createTask(projectId: number, task: Omit<Task, "id" | "projectId">): Promise<Task> {
    return request<Task>(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        due_date: task.dueDate || null,
        assignee: task.assignee || null
      })
    });
  },
  async updateTask(taskId: number, patch: Partial<Pick<Task, "title" | "description" | "status" | "priority" | "dueDate" | "assignee">>): Promise<Task> {
    const body: Record<string, unknown> = { ...patch };
    if ("dueDate" in patch) {
      body.due_date = patch.dueDate;
      delete body.dueDate;
    }
    return request<Task>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(body)
    });
  },
  async deleteTask(taskId: number): Promise<void> {
    return request<void>(`/tasks/${taskId}`, { method: "DELETE" });
  },
  async listMembers(projectId: number): Promise<ProjectMember[]> {
    return request<ProjectMember[]>(`/projects/${projectId}/members`);
  },
  async addMember(projectId: number, email: string): Promise<ProjectMember> {
    return request<ProjectMember>(`/projects/${projectId}/members`, {
      method: "POST",
      body: JSON.stringify({ email, role: "member" })
    });
  }
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "To-Do",
  in_progress: "In Progress",
  done: "Done"
};

export const priorityLabels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};
