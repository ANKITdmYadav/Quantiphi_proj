import { useEffect, useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, closestCorners, useDroppable,
  useSensor, useSensors, type DragEndEvent, type DragStartEvent
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Activity, CalendarDays, Check, ChevronDown, CircleHelp, Filter,
  LayoutGrid, ListTodo, MoreHorizontal, Plus, Search,
  Settings2, Sparkles, Trash2, UserPlus, Users, X, GripVertical, Pencil
} from "lucide-react";
import { api, priorityLabels, taskStatusLabels } from "./api";
import { initialMembers, initialTasks } from "./seed";
import type { Priority, ProjectMember, Task, TaskStatus } from "./types";

const columns: TaskStatus[] = ["todo", "in_progress", "done"];
const STORAGE_KEY = "taskflow-demo-tasks-v1";
const MEMBER_KEY = "taskflow-demo-members-v1";

function readStoredTasks(): Task[] {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) as Task[] : initialTasks;
  } catch { return initialTasks; }
}
function readStoredMembers(): ProjectMember[] {
  try {
    const value = localStorage.getItem(MEMBER_KEY);
    return value ? JSON.parse(value) as ProjectMember[] : initialMembers;
  } catch { return initialMembers; }
}
function formatDate(value: string) {
  if (!value) return "No due date";
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function isOverdue(task: Task) {
  return Boolean(task.dueDate && task.status !== "done" && task.dueDate < new Date().toISOString().slice(0, 10));
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase() || "?";
}
function nextId(items: { id: number }[]) {
  return Math.max(0, ...items.map(item => item.id)) + 1;
}

type TaskFormProps = {
  task?: Task;
  members: ProjectMember[];
  onClose: () => void;
  onSave: (values: Omit<Task, "id" | "projectId">, id?: number) => void;
};
function TaskForm({ task, members, onClose, onSave }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "medium");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim(), priority, status, dueDate, assignee }, task?.id);
  };
  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="modal" onSubmit={submit}>
        <div className="modal-heading">
          <div><span className="eyebrow">{task ? "UPDATE TASK" : "NEW TASK"}</span><h2>{task ? "Edit task" : "Create a task"}</h2></div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <label className="field-label">Task title <span className="required">*</span>
          <input autoFocus required maxLength={200} placeholder="e.g. Build authentication flow" value={title} onChange={e => setTitle(e.target.value)} />
        </label>
        <label className="field-label">Description
          <textarea rows={3} placeholder="What needs to get done?" value={description} onChange={e => setDescription(e.target.value)} />
        </label>
        <div className="form-grid">
          <label className="field-label">Priority
            <select value={priority} onChange={e => setPriority(e.target.value as Priority)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label className="field-label">Status
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}>
              {columns.map(col => <option key={col} value={col}>{taskStatusLabels[col]}</option>)}
            </select>
          </label>
        </div>
        <div className="form-grid">
          <label className="field-label">Due date
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </label>
          <label className="field-label">Assignee
            <select value={assignee} onChange={e => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {members.map(member => <option key={member.id} value={member.name}>{member.name}</option>)}
            </select>
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="button button-primary"><Check size={16} /> {task ? "Save changes" : "Create task"}</button>
        </div>
      </form>
    </div>
  );
}

function MembersModal({ members, onClose, onAdd }: { members: ProjectMember[]; onClose: () => void; onAdd: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) { setError("Enter a valid email address."); return; }
    if (members.some(member => member.email.toLowerCase() === clean)) { setError("This person is already on the project."); return; }
    onAdd(clean);
  };
  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-heading"><div><span className="eyebrow">COLLABORATION</span><h2>Project members</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button></div>
        <form className="member-add" onSubmit={submit}>
          <label className="field-label">Invite by email<input type="email" placeholder="teammate@company.com" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} required /></label>
          <button className="button button-primary" type="submit"><UserPlus size={16}/> Add</button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <div className="member-list">
          {members.map(member => <div className="member-row" key={member.id}><div className="avatar">{initials(member.name)}</div><div className="member-info"><strong>{member.name}</strong><span>{member.email}</span></div><span className="role-pill">{member.role}</span></div>)}
        </div>
        <p className="modal-note">Demo mode adds local placeholder members. Connect the backend to invite real registered users.</p>
      </div>
    </div>
  );
}

function SortableTaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };
  return (
    <article ref={setNodeRef} style={style} className="task-card">
      <div className="task-card-top">
        <span className={`priority priority-${task.priority}`}><span className="priority-dot"/> {priorityLabels[task.priority]}</span>
        <div className="card-actions">
          <button className="tiny-icon" aria-label="Edit task" title="Edit task" onClick={() => onEdit(task)}><Pencil size={14}/></button>
          <button className="tiny-icon danger-hover" aria-label="Delete task" title="Delete task" onClick={() => onDelete(task)}><Trash2 size={14}/></button>
          <button className="tiny-icon drag-handle" aria-label="Drag task" title="Drag task" {...attributes} {...listeners}><GripVertical size={16}/></button>
        </div>
      </div>
      <button className="task-title-button" onClick={() => onEdit(task)}>{task.title}</button>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className="task-card-bottom">
        <span className={`due-date ${isOverdue(task) ? "overdue" : ""}`}><CalendarDays size={13}/>{formatDate(task.dueDate)}{isOverdue(task) ? " · Late" : ""}</span>
        {task.assignee ? <span className="assignee" title={task.assignee}><span className="avatar avatar-small">{initials(task.assignee)}</span><span className="assignee-name">{task.assignee.split(" ")[0]}</span></span> : <span className="unassigned">Unassigned</span>}
      </div>
    </article>
  );
}

function BoardColumn({ status, tasks, onEdit, onDelete }: { status: TaskStatus; tasks: Task[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `column-${status}`, data: { type: "column", status } });
  const icons = { todo: <span className="column-dot todo-dot"/>, in_progress: <span className="column-dot progress-dot"/>, done: <span className="column-dot done-dot"/> };
  return (
    <section ref={setNodeRef} className={`board-column ${isOver ? "column-over" : ""}`}>
      <div className="column-heading"><div className="column-name">{icons[status]}<h3>{taskStatusLabels[status]}</h3><span className="task-count">{tasks.length}</span></div><button className="tiny-icon" aria-label={`More ${taskStatusLabels[status]} options`} title="Column options"><MoreHorizontal size={18}/></button></div>
      <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
        <div className="column-cards">
          {tasks.map(task => <SortableTaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete}/>)}
          {tasks.length === 0 && <div className="empty-column">Drop a task here</div>}
        </div>
      </SortableContext>
    </section>
  );
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(readStoredTasks);
  const [members, setMembers] = useState<ProjectMember[]>(readStoredMembers);
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [search, setSearch] = useState("");
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [notice, setNotice] = useState("");
  const [apiError, setApiError] = useState("");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!api.enabled) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    if (!api.enabled) localStorage.setItem(MEMBER_KEY, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    if (!api.enabled) return;
    api.listTasks(1).then(setTasks).catch(error => setApiError(error instanceof Error ? error.message : "Could not load tasks"));
    api.listMembers(1).then(setMembers).catch(() => { /* Members can be wired independently. */ });
  }, []);

  const visibleTasks = useMemo(() => tasks.filter(task => {
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const needle = search.trim().toLowerCase();
    const matchesSearch = !needle || `${task.title} ${task.description} ${task.assignee}`.toLowerCase().includes(needle);
    return matchesPriority && matchesSearch;
  }), [tasks, priorityFilter, search]);
  const groupedTasks = useMemo(() => Object.fromEntries(columns.map(status => [status, visibleTasks.filter(task => task.status === status)])) as Record<TaskStatus, Task[]>, [visibleTasks]);
  const completedCount = tasks.filter(task => task.status === "done").length;
  const completion = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;

  function toast(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }

  async function saveTask(values: Omit<Task, "id" | "projectId">, id?: number) {
    try {
      if (id) {
        const oldTask = tasks.find(task => task.id === id);
        const updated: Task = { ...oldTask!, ...values };
        if (api.enabled) {
          const saved = await api.updateTask(id, { ...values });
          setTasks(previous => previous.map(task => task.id === id ? { ...updated, ...saved } : task));
        } else setTasks(previous => previous.map(task => task.id === id ? updated : task));
        toast("Task updated");
      } else {
        if (api.enabled) {
          const saved = await api.createTask(1, values);
          setTasks(previous => [saved, ...previous]);
        } else {
          const newTask: Task = { ...values, id: nextId(tasks), projectId: 1 };
          setTasks(previous => [newTask, ...previous]);
        }
        toast("Task created");
      }
      setShowTaskForm(false);
      setModalTask(null);
      setApiError("");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not save task");
    }
  }

  async function deleteTask(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      if (api.enabled) await api.deleteTask(task.id);
      setTasks(previous => previous.filter(item => item.id !== task.id));
      toast("Task deleted");
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Could not delete task");
    }
  }

  async function moveTask(taskId: number, status: TaskStatus) {
    const task = tasks.find(item => item.id === taskId);
    if (!task || task.status === status) return;
    const oldStatus = task.status;
    setTasks(previous => previous.map(item => item.id === taskId ? { ...item, status } : item));
    try {
      if (api.enabled) await api.updateTask(taskId, { status });
      toast(`Moved to ${taskStatusLabels[status]}`);
    } catch (error) {
      setTasks(previous => previous.map(item => item.id === taskId ? { ...item, status: oldStatus } : item));
      setApiError(error instanceof Error ? error.message : "Could not move task");
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(item => item.id === event.active.id);
    setActiveTask(task ?? null);
  }
  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const taskId = Number(active.id);
    const targetTask = tasks.find(task => task.id === over.id);
    const targetStatus = targetTask?.status ?? (typeof over.id === "string" && over.id.startsWith("column-") ? over.id.replace("column-", "") as TaskStatus : undefined);
    if (targetStatus && columns.includes(targetStatus)) void moveTask(taskId, targetStatus);
  }

  function addMember(email: string) {
    const namePart = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
    const newMember: ProjectMember = { id: nextId(members), name: namePart, email, role: "member" };
    if (api.enabled) {
      api.addMember(1, email).then(member => setMembers(previous => [...previous, member])).catch(error => setApiError(error instanceof Error ? error.message : "Could not add member"));
    } else setMembers(previous => [...previous, newMember]);
    setShowMembers(false);
    toast("Member added");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><LayoutGrid size={20}/></div><span>task<span className="brand-light">flow</span></span><span className="brand-beta">BETA</span></div>
        <div className="workspace-switch"><div className="workspace-icon">T</div><div className="workspace-copy"><strong>Team Workspace</strong><span>Free plan</span></div><ChevronDown size={15}/></div>
        <div className="sidebar-section-label">WORKSPACE</div>
        <button className="nav-item"><LayoutGrid size={17}/> Overview</button>
        <button className="nav-item active"><ListTodo size={17}/> My tasks <span className="nav-count">{tasks.filter(t => t.status !== "done").length}</span></button>
        <button className="nav-item" onClick={() => setShowMembers(true)}><Users size={17}/> Members</button>
        <div className="sidebar-section-label projects-label">YOUR PROJECTS <button aria-label="Add project" title="Add project" onClick={() => toast("Project creation can be added next.")}><Plus size={14}/></button></div>
        <button className="project-item selected"><span className="project-color violet"/>Task Management App</button>
        <button className="project-item"><span className="project-color blue"/>Website Redesign</button>
        <button className="project-item"><span className="project-color orange"/>Marketing Launch</button>
        <div className="sidebar-bottom">
          <div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><div><strong>Need a hand?</strong><span>Learn how TaskFlow works</span></div></div>
          <button className="nav-item"><Settings2 size={17}/> Settings</button>
          <div className="profile"><div className="avatar profile-avatar">AY</div><div className="profile-copy"><strong>Ankit Yadav</strong><span>Personal workspace</span></div><MoreHorizontal size={18}/></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb">Projects <span>/</span> <strong>Task Management App</strong></div><div className="topbar-right"><span className={`connection-status ${api.enabled ? "connected" : ""}`}><span/> {api.enabled ? "API mode" : "Demo mode"}</span><button className="icon-button top-help" aria-label="Help"><CircleHelp size={18}/></button><div className="avatar profile-avatar">AY</div></div></header>
        <div className="page-content">
          <div className="project-heading">
            <div><div className="eyebrow"><span className="project-color violet"/> PROJECT BOARD</div><h1>Task Management App <button className="title-chevron" aria-label="Project options"><ChevronDown size={19}/></button></h1><p className="page-subtitle">Plan, track, and ship great work together.</p></div>
            <div className="heading-actions"><button className="button button-secondary" onClick={() => setShowMembers(true)}><Users size={16}/> <span>Members</span></button><button className="button button-primary" onClick={() => { setModalTask(null); setShowTaskForm(true); }}><Plus size={17}/> New task</button></div>
          </div>

          <div className="stats-row">
            <div className="stat-card"><div className="stat-icon purple"><ListTodo size={18}/></div><div><span>Total tasks</span><strong>{tasks.length}</strong></div><span className="stat-note">In this project</span></div>
            <div className="stat-card"><div className="stat-icon amber"><Activity size={18}/></div><div><span>In progress</span><strong>{tasks.filter(t => t.status === "in_progress").length}</strong></div><span className="stat-note">Being worked on</span></div>
            <div className="stat-card"><div className="stat-icon green"><Check size={18}/></div><div><span>Completed</span><strong>{completedCount}</strong></div><span className="stat-note">{completion}% of all tasks</span></div>
            <div className="stat-card members-stat"><div className="stat-icon blue"><Users size={18}/></div><div><span>Team members</span><strong>{members.length}</strong></div><button onClick={() => setShowMembers(true)} className="stat-link">Manage team <span>→</span></button></div>
          </div>

          <div className="board-toolbar">
            <div className="view-tabs"><button className="view-tab selected"><LayoutGrid size={15}/> Board</button><button className="view-tab" onClick={() => toast("List view is coming soon.")}><ListTodo size={15}/> List</button></div>
            <div className="toolbar-controls">
              <label className="search-box"><Search size={16}/><input aria-label="Search tasks" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}/>{search && <button onClick={() => setSearch("")} aria-label="Clear search"><X size={14}/></button>}</label>
              <label className="filter-select"><Filter size={15}/><select aria-label="Filter by priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}><option value="all">All priorities</option><option value="high">High priority</option><option value="medium">Medium priority</option><option value="low">Low priority</option></select><ChevronDown size={13}/></label>
              <button className="icon-button filter-settings" title="Filter settings" aria-label="Filter settings" onClick={() => toast("Use the priority dropdown to filter tasks.")}><Settings2 size={17}/></button>
            </div>
          </div>

          {apiError && <div className="error-banner"><span>{apiError}</span><button onClick={() => setApiError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="kanban-board">
              {columns.map(status => <BoardColumn key={status} status={status} tasks={groupedTasks[status]} onEdit={task => { setModalTask(task); setShowTaskForm(true); }} onDelete={task => void deleteTask(task)}/>)}
            </div>
            <DragOverlay>{activeTask ? <div className="drag-overlay-card"><span className={`priority priority-${activeTask.priority}`}>{priorityLabels[activeTask.priority]}</span><strong>{activeTask.title}</strong></div> : null}</DragOverlay>
          </DndContext>
          <div className="board-footer"><span><Sparkles size={14}/> Small steps make big progress.</span><span>Showing {visibleTasks.length} of {tasks.length} tasks</span></div>
        </div>
      </main>

      {showTaskForm && <TaskForm task={modalTask ?? undefined} members={members} onClose={() => { setShowTaskForm(false); setModalTask(null); }} onSave={(values, id) => void saveTask(values, id)}/>}
      {showMembers && <MembersModal members={members} onClose={() => setShowMembers(false)} onAdd={addMember}/>}
      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </div>
  );
}
