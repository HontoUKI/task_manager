# API

Base path: `/api`.

## Task Model

Response fields:

- `id`: integer
- `title`: non-empty string, maximum 200 characters
- `description`: string or `null`
- `status`: `todo`, `in_progress`, or `done`
- `assigned_to`: string or `null`, maximum 120 characters
- `created_at`: creation timestamp
- `updated_at`: last update timestamp

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/tasks` | Create a task |
| `GET` | `/api/tasks` | List tasks with optional `status` and `assigned_to` filters |
| `GET` | `/api/tasks/{id}` | Read one task |
| `PATCH` | `/api/tasks/{id}` | Update `title`, `description`, or `status` |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

## Errors

- `422`: request validation failed
- `404`: task not found
- `429`: rate limit exceeded

## Input Safety

Database queries are built through the SQLAlchemy expression API. User-provided
JSON values and query parameters are passed as query parameters, not concatenated
into SQL strings.
