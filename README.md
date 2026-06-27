# Basic Overlay

Personal desktop overlay for practicing frontend work with Tauri while keeping a
small task/spec workspace on screen.

This is intentionally not a SaaS/product scaffold. The goal is a compact local
tool: task list, live spec notes, global shortcuts, tray behavior, and a small
FastAPI task API in `sub-module`.

## What Is In This Repo

- `src/`: React + Vite overlay UI.
- `src-tauri/`: Tauri v2 shell, native window behavior, tray, and global shortcuts.
- `sub-module/`: FastAPI task management API with SQLAlchemy, Alembic, SQLite, and tests.
- `scripts/tauri-cli.mjs`: wrapper that keeps Vite and Tauri pointed at the same dev port.
- `Makefile`: common install, run, build, and check commands.

## Overlay Features

- Transparent, frameless, always-on-top Tauri window.
- Draggable overlay handle backed by native `start_dragging`.
- Task list with add, complete, and remove actions.
- Live spec textarea for acceptance notes and implementation details.
- Local browser storage under `basic-overlay-state`.
- Tray menu with show, hide, click-through toggle, and quit actions.
- Window close hides to tray; quit from tray exits the process.
- Click-through mode lowers opacity and lets clicks pass to windows below.

## Shortcuts

- `Alt+Shift+Space`: show or hide the overlay.
- `Alt+Shift+C`: toggle click-through.

Shortcuts are registered in Rust so they work while the overlay is hidden or
click-through is enabled.

## Setup

Install dependencies:

```powershell
make install
```

Equivalent manual commands:

```powershell
npm install
cd sub-module
uv sync
```

Configure the frontend dev server if the default port is busy:

```powershell
Copy-Item .env.example .env
```

Then edit `.env`:

```dotenv
VITE_DEV_SERVER_HOST=127.0.0.1
VITE_DEV_SERVER_PORT=1421
```

`npm run tauri dev` and `npm run tauri:dev` both read this port through
`scripts/tauri-cli.mjs`.

## Run

Run the desktop app:

```powershell
make start
```

This starts the FastAPI sub-module in the background, then runs the Tauri app.
Sub-module logs are written to `.local/sub-module.out.log` and
`.local/sub-module.err.log`.

Run only the frontend dev server:

```powershell
make dev
```

Run the FastAPI sub-module:

```powershell
make sub-run
```

`make sub-run` keeps the API in the current terminal. `make start` uses the
background `sub-start` target instead.

## Check

Run the main verification path:

```powershell
make check
```

This runs:

- `npm run build`
- `cargo check`
- `cd sub-module && uv run pytest`

## Sub-Module

The backend service exposes task CRUD under `/api/tasks`, uses SQLite by default,
and has Alembic migrations plus pytest coverage. See
[`sub-module/README.MD`](sub-module/README.MD) for details.

## Notes

- Node/Vite drive the frontend.
- Cargo drives the Tauri shell.
- Python dependencies are managed with `uv`.
- Local generated files such as `.env`, `dist/`, `node_modules/`, `.venv/`,
  `target/`, and SQLite databases are ignored.
