from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.crud import tasks as task_crud
from app.database import Base, engine, get_db
from app.models import TaskStatus
from app.rate_limit import RateLimitMiddleware
from app.schemas import TaskCreate, TaskRead, TaskUpdate


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local development convenience: production should prefer Alembic migrations.
    Base.metadata.create_all(bind=engine)
    yield


# The API is intentionally small: task CRUD plus a lightweight rate limiter.
app = FastAPI(
    title="Task Management API",
    description="Small API for creating, listing, updating, and deleting tasks.",
    version="0.1.0",
    lifespan=lifespan,
)
app.add_middleware(RateLimitMiddleware, limit=120, window_seconds=60)


@app.post("/api/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    return task_crud.create_task(db, payload)


@app.get("/api/tasks", response_model=list[TaskRead])
def list_tasks(
    status_filter: TaskStatus | None = Query(default=None, alias="status"),
    assigned_to: str | None = None,
    db: Session = Depends(get_db),
):
    # `status` is exposed as a query alias to keep the public API concise.
    return task_crud.list_tasks(db, status=status_filter, assigned_to=assigned_to)


@app.get("/api/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = task_crud.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


@app.patch("/api/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = task_crud.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task_crud.update_task(db, task, payload)


@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = task_crud.get_task(db, task_id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    task_crud.delete_task(db, task)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
