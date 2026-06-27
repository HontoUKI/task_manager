from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Task, TaskStatus
from app.schemas import TaskCreate, TaskUpdate


def create_task(db: Session, payload: TaskCreate) -> Task:
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def list_tasks(
    db: Session,
    *,
    status: TaskStatus | None = None,
    assigned_to: str | None = None,
) -> list[Task]:
    # Build filters with SQLAlchemy expressions so user input stays parameterized.
    statement = select(Task).order_by(Task.id)
    if status is not None:
        statement = statement.where(Task.status == status)
    if assigned_to is not None:
        statement = statement.where(Task.assigned_to == assigned_to)
    return list(db.scalars(statement).all())


def get_task(db: Session, task_id: int) -> Task | None:
    return db.get(Task, task_id)


def update_task(db: Session, task: Task, payload: TaskUpdate) -> Task:
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    db.delete(task)
    db.commit()
