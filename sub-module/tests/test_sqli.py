from fastapi.testclient import TestClient


def test_assigned_to_filter_treats_sql_payload_as_plain_text(client: TestClient) -> None:
    """The filter treats SQL-like text as data and does not widen the result set."""
    client.post("/api/tasks", json={"title": "Private task", "assigned_to": "alice"})
    client.post("/api/tasks", json={"title": "Public task", "assigned_to": "bob"})

    response = client.get("/api/tasks", params={"assigned_to": "alice' OR '1'='1"})

    assert response.status_code == 200
    assert response.json() == []


def test_text_fields_store_sql_payload_without_breaking_table(client: TestClient) -> None:
    """SQL-like payload text is stored as data and never executed."""
    payload = "Robert'); DROP TABLE tasks;--"

    create_response = client.post("/api/tasks", json={"title": payload, "description": payload})
    list_response = client.get("/api/tasks")

    assert create_response.status_code == 201
    assert create_response.json()["title"] == payload
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_task_id_path_rejects_sql_payload(client: TestClient) -> None:
    """FastAPI rejects SQL-like path text because task IDs are typed as integers."""
    response = client.get("/api/tasks/1 OR 1=1")

    assert response.status_code == 422
