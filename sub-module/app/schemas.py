from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import TaskStatus


# Shared fields for task create/read payloads. Extra input is rejected by default.
class TaskBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus = TaskStatus.TODO


class TaskCreate(TaskBase):
    assigned_to: str | None = Field(default=None, max_length=120)


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # PATCH payloads are partial, but provided values still keep strict bounds.
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    status: TaskStatus | None = None


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: TaskStatus
    assigned_to: str | None
    created_at: datetime
    updated_at: datetime
