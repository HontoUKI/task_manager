# Architecture

The project is intentionally small and split by responsibility.

- `app/main.py`: FastAPI application, routes, and dependency wiring
- `app/database.py`: SQLAlchemy engine, session factory, and declarative base
- `app/models.py`: SQLAlchemy task model and status enum
- `app/schemas.py`: Pydantic models for requests and responses
- `app/crud/tasks.py`: database operations
- `app/rate_limit.py`: simple in-memory request limiter
- `alembic/`: database migrations
- `tests/`: pytest suite using in-memory SQLite

## Request Flow

1. FastAPI validates input through Pydantic schemas.
2. The route receives a SQLAlchemy session through `get_db`.
3. The CRUD layer executes SQLAlchemy expressions.
4. The response is serialized through `TaskRead`.

## Limitations

Rate limiting stores counters in process memory. This is enough for a single
local service, but multi-process or multi-server deployments should move this
state to an external store such as Redis.

Tables are created at application startup for local development convenience. A
normal production flow should update schema only through Alembic migrations.
