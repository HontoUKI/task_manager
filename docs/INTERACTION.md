# Interaction Flow

This diagram shows how the overlay, native Tauri shell, and FastAPI sub-module
work together during local development.

```mermaid
flowchart LR
  User[User]

  subgraph Desktop["Tauri Desktop App"]
    React["React Overlay UI\nsrc/App.tsx + components"]
    Native["Rust Native Shell\nsrc-tauri/src/lib.rs"]
    Storage["localStorage\nlive spec only"]
  end

  subgraph Backend["FastAPI Sub-Module"]
    API["FastAPI Routes\n/app/main.py"]
    CRUD["CRUD Layer\napp/crud/tasks.py"]
    DB[("SQLite\nsub-module/tasks.db")]
  end

  User -->|"clicks / typing"| React
  User -->|"Alt+Shift+Space\nAlt+Shift+C"| Native
  User -->|"tray menu"| Native

  React -->|"invoke: hide_overlay\nstart_window_drag\ntoggle_click_through"| Native
  Native -->|"event: overlay://click-through-changed"| React

  React -->|"GET /api/tasks"| API
  React -->|"POST /api/tasks"| API
  React -->|"PATCH /api/tasks/{id}"| API
  React -->|"DELETE /api/tasks/{id}"| API

  API --> CRUD
  CRUD --> DB
  DB --> CRUD
  CRUD --> API
  API -->|"JSON task payloads"| React

  React -->|"persist live spec"| Storage
  Storage -->|"restore live spec"| React
```

## Notes

- Tasks are loaded and mutated through the FastAPI API.
- Live spec text is still local-only and stored in `localStorage`.
- Click-through is owned by Rust because the WebView cannot receive mouse input
  after cursor events are ignored.
- `make start` starts the backend in the background before launching Tauri.
