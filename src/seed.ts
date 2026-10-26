import type { ProjectMember, Task } from "./types";

export const initialTasks: Task[] = [
  {
    id: 1,
    title: "Set up project repository",
    description: "Create the repository, define the folder structure, and add the development README.",
    status: "done",
    priority: "high",
    dueDate: "2026-10-20",
    assignee: "Ankit",
    projectId: 1
  },
  {
    id: 2,
    title: "Design dashboard layout",
    description: "Build the board header, column layout, and responsive task cards.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-10-28",
    assignee: "Priya",
    projectId: 1
  },
  {
    id: 3,
    title: "Create task API",
    description: "Implement create, update, list, and delete endpoints in FastAPI.",
    status: "todo",
    priority: "high",
    dueDate: "2026-10-30",
    assignee: "Ankit",
    projectId: 1
  },
  {
    id: 4,
    title: "Connect PostgreSQL",
    description: "Create the task and project tables and configure SQLAlchemy.",
    status: "todo",
    priority: "medium",
    dueDate: "2026-11-02",
    assignee: "Sam",
    projectId: 1
  },
  {
    id: 5,
    title: "Add priority filters",
    description: "Allow the board to filter tasks by low, medium, and high priority.",
    status: "todo",
    priority: "low",
    dueDate: "2026-11-04",
    assignee: "Priya",
    projectId: 1
  },
  {
    id: 6,
    title: "Test drag and drop",
    description: "Verify that tasks move between columns and preserve their status.",
    status: "in_progress",
    priority: "medium",
    dueDate: "2026-10-29",
    assignee: "Sam",
    projectId: 1
  }
];

export const initialMembers: ProjectMember[] = [
  { id: 1, name: "Ankit Yadav", email: "ankit@example.com", role: "owner" },
  { id: 2, name: "Priya Sharma", email: "priya@example.com", role: "member" },
  { id: 3, name: "Sam Wilson", email: "sam@example.com", role: "member" }
];
