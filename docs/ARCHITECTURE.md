# Architecture

## Shape

The repo has three working areas:

- `src/`: React + Vite frontend for the overlay UI.
- `src-tauri/`: Tauri v2 shell, native commands, tray, and global shortcuts.
- `sub-module/`: FastAPI task management API.

The overlay currently stores UI task/spec state in `localStorage`. The backend
sub-module is a separate API surface that can become the durable task store.

## Frontend

`src/main.tsx` contains the current UI because the surface is still small. It
handles:

- local task state,
- live spec text,
- click-through status display,
- native drag requests,
- events emitted by Rust when click-through changes.

The browser state is persisted under `basic-overlay-state`.

## Native Shell

`src-tauri/src/lib.rs` owns behavior the browser cannot handle reliably:

- frameless transparent window,
- always-on-top overlay behavior,
- native window dragging,
- close-to-tray behavior,
- tray menu,
- show/hide global shortcut,
- click-through global shortcut,
- click-through cursor event toggling.

Click-through state is stored in Rust because once cursor events are ignored the
WebView cannot receive the click needed to undo that state. Rust emits
`overlay://click-through-changed` so React can update the visual state.

## Dev Port Flow

Vite reads `VITE_DEV_SERVER_HOST` and `VITE_DEV_SERVER_PORT` from the root `.env`.
Tauri needs the same URL before startup, so `scripts/tauri-cli.mjs` writes
`.local/tauri.dev.conf.json` and passes it to `tauri dev --config`.

This prevents Vite from silently moving to another port while Tauri waits on the
old one.

## FastAPI Sub-Module

`sub-module` is a small task API:

- `app/main.py`: routes and middleware wiring,
- `app/database.py`: SQLAlchemy engine/session setup,
- `app/models.py`: task table and status enum,
- `app/schemas.py`: Pydantic request/response models,
- `app/crud/tasks.py`: database operations,
- `alembic/`: schema migrations,
- `tests/`: pytest coverage with in-memory SQLite.

The API defaults to `sqlite:///./tasks.db` and can be pointed elsewhere through
`DATABASE_URL`.

## Verification

`make check` is the main local verification command:

1. `npm run build`
2. `cargo check`
3. `cd sub-module && uv run pytest`

## Decisions To Revisit

- Whether the overlay should fully replace `localStorage` with the API.
- Whether Tauri should own persistence directly for offline use.
- Whether global shortcuts should be configurable from UI settings.
- Whether the overlay should stay one window or support separate task/spec views.
