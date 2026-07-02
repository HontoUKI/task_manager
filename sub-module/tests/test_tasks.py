from fastapi.testclient import TestClient


def test_create_task(client: TestClient) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Write tests", "description": "Cover CRUD", "assigned_to": "alice"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 1
    assert data["title"] == "Write tests"
    assert data["status"] == "todo"
    assert data["assigned_to"] == "alice"


def test_list_tasks_with_filters(client: TestClient) -> None:
    client.post("/api/tasks", json={"title": "First", "status": "todo", "assigned_to": "alice"})
    client.post("/api/tasks", json={"title": "Second", "status": "done", "assigned_to": "bob"})

    response = client.get("/api/tasks", params={"status": "done", "assigned_to": "bob"})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Second"


def test_get_task_404(client: TestClient) -> None:
    response = client.get("/api/tasks/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_update_task(client: TestClient) -> None:
    create_response = client.post("/api/tasks", json={"title": "Draft"})
    task_id = create_response.json()["id"]

    response = client.patch(
        f"/api/tasks/{task_id}",
        json={
            "title": "Reviewed",
            "description": "Ready",
            "status": "in_progress",
            "assigned_to": "carol",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Reviewed"
    assert data["description"] == "Ready"
    assert data["status"] == "in_progress"
    assert data["assigned_to"] == "carol"


def test_delete_task(client: TestClient) -> None:
    create_response = client.post("/api/tasks", json={"title": "Remove me"})
    task_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/tasks/{task_id}")
    get_response = client.get(f"/api/tasks/{task_id}")

    assert delete_response.status_code == 204
    assert get_response.status_code == 404


def test_validation_rejects_empty_title_and_extra_fields(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": "", "unexpected": "field"})

    assert response.status_code == 422
