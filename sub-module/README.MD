# Task Management API

Small FastAPI service for task management.

## Features

- CRUD endpoints under `/api/tasks`
- SQLite storage by default
- SQLAlchemy 2.0 models
- Alembic migrations
- Pydantic v2 schemas with `extra="forbid"`
- Simple in-memory rate limiting middleware
- pytest coverage for CRUD, validation, 404 handling, and basic SQL injection scenarios

## Setup

```powershell
uv sync
Copy-Item .env.example .env
```

Optional environment variable:

```dotenv
DATABASE_URL=sqlite:///./tasks.db
```

If `DATABASE_URL` is not set, the app uses `sqlite:///./tasks.db`.

## Run

```powershell
uv run uvicorn app.main:app --reload
```

OpenAPI:

- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`

## Migrations

```powershell
uv run alembic upgrade head
```

For local development, the app also creates missing tables on startup.

## Tests

```powershell
uv run pytest
```

Tests use in-memory SQLite and do not depend on local `tasks.db`.

## API

Create a task:

`POST /api/tasks`

```json
{
  "title": "Write tests",
  "description": "Cover CRUD",
  "status": "todo",
  "assigned_to": "alice"
}
```

List tasks:

`GET /api/tasks`

Supported query filters:

- `status`: `todo`, `in_progress`, `done`
- `assigned_to`: assignee name

Read one task:

`GET /api/tasks/{id}`

Update a task:

`PATCH /api/tasks/{id}`

```json
{
  "title": "Reviewed title",
  "description": "Updated details",
  "status": "done"
}
```

Delete a task:

`DELETE /api/tasks/{id}`
