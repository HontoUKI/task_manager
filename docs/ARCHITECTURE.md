# Architecture

## Shape

The repo has three working areas:

- `src/`: React + Vite frontend for the overlay UI.
- `src-tauri/`: Tauri v2 shell, native commands, tray, and global shortcuts.
- `sub-module/`: FastAPI task management API.

The overlay loads and mutates tasks through the FastAPI sub-module. Live spec
text is still local-only and stored in `localStorage`.

See [`INTERACTION.md`](INTERACTION.md) for the Mermaid interaction diagram.

## Frontend

`src/main.tsx` contains the current UI because the surface is still small. It
mounts `src/App.tsx`. The app is split into:

- `src/App.tsx`: state orchestration and native/API calls,
- `src/api/tasks.ts`: HTTP client for the FastAPI task API,
- `src/components/TitleBar.tsx`: drag, hide, and click-through controls,
- `src/components/TaskPanel.tsx`: task list and task mutations,
- `src/components/SpecPanel.tsx`: live spec editor.

Live spec text is persisted under `basic-overlay-state`.

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

- Whether live spec persistence should move to the API too.
- Whether Tauri should own persistence directly for offline use.
- Whether global shortcuts should be configurable from UI settings.
- Whether the overlay should stay one window or support separate task/spec views.
