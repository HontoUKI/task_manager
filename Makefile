.PHONY: help install start dev build preview tauri-dev tauri-build cargo-check sub-sync sub-test sub-start sub-run test check clean

help:
	@echo "Targets:"
	@echo "  install      Install Node and Python dependencies"
	@echo "  start        Run the FastAPI sub-module and Task Manager desktop app"
	@echo "  dev          Run the frontend dev server"
	@echo "  tauri-dev    Run the Tauri desktop app"
	@echo "  build        Build the frontend"
	@echo "  tauri-build  Build the Tauri app bundle"
	@echo "  check        Run frontend, Rust, and backend checks"
	@echo "  sub-run      Run the FastAPI sub-module"

install:
	npm install
	cd sub-module && uv sync

start: sub-start tauri-dev

dev:
	npm run dev

preview:
	npm run preview

build:
	npm run build

tauri-dev:
	npm run tauri:dev

tauri-build:
	npm run tauri:build

cargo-check:
	cd src-tauri && cargo check

sub-sync:
	cd sub-module && uv sync

sub-test:
	cd sub-module && uv run pytest

sub-start:
	powershell -NoProfile -ExecutionPolicy Bypass -Command "$$port = 8000; $$existing = Get-NetTCPConnection -LocalPort $$port -State Listen -ErrorAction SilentlyContinue; if ($$existing) { Write-Host \"sub-module already listening on port $$port\"; exit 0 }; $$root = Get-Location; $$logDir = Join-Path $$root \".local\"; New-Item -ItemType Directory -Force -Path $$logDir | Out-Null; Start-Process -FilePath \"uv\" -ArgumentList @(\"run\", \"uvicorn\", \"app.main:app\", \"--reload\", \"--host\", \"127.0.0.1\", \"--port\", \"8000\") -WorkingDirectory (Join-Path $$root \"sub-module\") -WindowStyle Hidden -RedirectStandardOutput (Join-Path $$logDir \"sub-module.out.log\") -RedirectStandardError (Join-Path $$logDir \"sub-module.err.log\"); Write-Host \"sub-module started on http://127.0.0.1:8000\""

sub-run:
	cd sub-module && uv run uvicorn app.main:app --reload

test: sub-test

check: build cargo-check sub-test

clean:
	cd sub-module && uv run python -c "import shutil; [shutil.rmtree(path, ignore_errors=True) for path in ('.pytest_cache', 'app/__pycache__', 'app/crud/__pycache__', 'tests/__pycache__', 'alembic/__pycache__', 'alembic/versions/__pycache__')]"
