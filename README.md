# TaskFlow Client

A React + TypeScript + Vite Kanban frontend for a task management app.

## Requirements

- Node.js 20 or newer (recommended)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints, usually `http://localhost:5173`.

## Included

- To-Do, In Progress and Done Kanban columns
- Drag-and-drop task movement
- Create, edit and delete tasks
- Priority and due-date labels
- Priority filter
- Assignee selector
- Project member management demo
- Local browser persistence using `localStorage`

## API integration

This client runs in demo mode by default so you can test the UI before the backend exists.
To connect a FastAPI backend:

1. Copy `.env.example` to `.env`.
2. Set `VITE_API_BASE_URL`, for example `http://localhost:8000/api`.
3. Implement the endpoints described in `src/api.ts`.
4. Set `VITE_USE_API=true` in `.env` to enable API mode.

The expected API contract is documented in `src/api.ts`. The backend must allow the Vite origin (`http://localhost:5173`) via CORS.

Do not put database credentials or privileged secrets in this frontend. React should call FastAPI; FastAPI should connect to PostgreSQL.
