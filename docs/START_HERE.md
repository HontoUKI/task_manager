# Start Here

This project starts as a small local overlay, not a general productivity
platform. Keep changes focused on making the overlay faster and more useful
during real work sessions.

## First Run

1. Install dependencies:

   ```powershell
   make install
   ```

2. Copy the root env example if the default Vite port is busy:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Run the desktop app:

   ```powershell
   make start
   ```

   This also starts the FastAPI sub-module in the background.

4. Optional: run the backend API:

   ```powershell
   make sub-run
   ```

## Daily Commands

- `make start`: run the FastAPI sub-module and Task Manager desktop app.
- `make tauri-dev`: run the desktop overlay directly.
- `make sub-start`: run the FastAPI API in the background.
- `make dev`: run only Vite.
- `make sub-run`: run the FastAPI API in the current terminal.
- `make check`: run frontend build, Rust check, and backend tests.
- `make clean`: remove Python test caches.

## Data Flow

Tasks come from the FastAPI sub-module at `VITE_API_BASE_URL`. Live spec text
still stays in local browser storage. The full interaction diagram is in
[`INTERACTION.md`](INTERACTION.md).

## Control Surface

- Drag the overlay from the grip button in the titlebar.
- `Alt+Shift+Space`: show or hide overlay.
- `Alt+Shift+C`: toggle click-through.
- Tray menu: show, hide, toggle click-through, quit.

Click-through makes the entire overlay ignore mouse events, including the button
that enabled it. Use `Alt+Shift+C` or the tray menu to turn it off.

## Near-Term Backlog

- Decide whether task/spec persistence should live in Tauri, the API, or both.
- Add configurable global shortcuts.
- Add import/export for task and live spec state.
- Decide whether Docker is useful for local API/dev setup.
