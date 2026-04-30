<!-- Jonathan Torres restructured this file -->

# Calcura

A smart budgeting web application for personal finance management. Users can sign up, view a dashboard of spending and budgets, manage reusable budget templates, set financial goals, and model how to reach them with the Goal Seek tool.

Built as an IT Capstone project at Liberty University (Fall 2025 – Spring 2026).

## Features

- **User accounts** — signup, login, forgot password, account settings
- **Dashboard** — pie chart visualizations, expense breakdown, transactions list, time-period filtering, what-if analysis
- **Budgeting** — budget template creation and management, categorized line items, investment and savings account types
- **Financial goals** — goal creation (target amount, target date, APR, down payment, interest), goal tracking widget, Goal Seek modeling
- **Recommended Budget** — personalized budget suggestions
- **Admin panel** — account management, mortgage budgeting, APR budgeting (gated to admin users)
- **Browser navigation** — back/forward support, deep-linkable URLs, per-page color-themed UI

## Tech Stack

| Layer | Tools |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI, Recharts |
| Backend | FastAPI, Python 3.12, SQLAlchemy ORM (SQLite, Postgres, MySQL) |
| Testing | Vitest + React Testing Library (frontend), pytest + FastAPI TestClient (backend) |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |

## Quick Start (Development)

Run `bash setup.sh` to install all dependencies and start both the frontend and backend in development mode. This handles the frontend, backend, and Python virtual environment setup for you.

- Frontend dev server: http://localhost:3000 (Vite, hot reload)
- Backend API: http://localhost:8000

To shut everything down, press `Ctrl+C` in the terminal.

### Manual run

If you'd rather run pieces individually:

```bash
# Frontend
npm install
npm run dev

# Backend (in a separate terminal)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Production

Two deployment options ship with this project. Both serve the API and the built frontend from a single process on port 8000.

### Bare-metal

```bash
./deploy.sh
```

This installs frontend and backend dependencies, builds the frontend, and starts the application on `http://0.0.0.0:8000`.

### Docker (recommended)

The release pipeline publishes images to GHCR on every GitHub release.

```bash
docker pull ghcr.io/calcura-capstone-org/project-calcura-capstone:latest
docker run -p 8000:8000 ghcr.io/calcura-capstone-org/project-calcura-capstone:latest
```

To build the image yourself:

```bash
docker build -t calcura .
docker run -p 8000:8000 calcura
```

## Database

The backend talks to its database through SQLAlchemy, so the same Docker image works with SQLite, Postgres, or MySQL — only the connection string changes. The database choice is controlled by the `DATABASE_URL` environment variable. If it's unset, the app falls back to a local SQLite file at `Database/CalcuraV1.db`.

```bash
# SQLite (default — zero config, good for local dev)
uvicorn main:app --reload

# Postgres
export DATABASE_URL=postgresql://user:pass@host:5432/dbname
uvicorn main:app --reload

# MySQL
export DATABASE_URL=mysql+pymysql://user:pass@host:3306/dbname
uvicorn main:app --reload
```

**Schema is created on first start.** The app calls `Base.metadata.create_all()` at boot, which adds any missing tables and leaves existing ones alone. So pointing at a fresh empty database creates the schema; pointing at a database that already has data just uses what's there.

**Data stays in its flavor.** Postgres files only work with Postgres, SQLite files only work with SQLite — moving data between engines means dumping from one and importing into the other with a tool that translates the SQL dialects.

**`docker compose up --build`** brings up the API together with a Postgres container, healthcheck-gated so the API waits for the database to be ready. The `pgdata` named volume keeps the database between restarts; `docker compose down -v` wipes it for a clean slate.

**Seed data.** On container start (or by running `python -m db.seed` manually) the database is populated with lifecycle stages, admin/user roles, and two default users:

- `admin@calcura.com` / `admin123` (admin role)
- `test@calcura.com` / `test123` (regular user)

Dev defaults — replace before any real deployment.

## Project Structure

```
project-calcura-capstone/
├── main.py                 # FastAPI entry point (serves API + built frontend)
├── db/                     # SQLAlchemy engine, ORM models, seed script
├── deploy.sh               # Production deploy script (bare-metal)
├── setup.sh / setup.bat    # Dev setup scripts (Linux/macOS / Windows)
├── Dockerfile              # Multi-stage Node + Python build
├── docker-compose.yml      # API + Postgres stack for local/full-stack runs
├── requirements.txt        # Python dependencies
├── package.json            # Frontend dependencies and scripts
├── .env                    # Dev env vars (VITE_API_URL=http://localhost:8000)
├── .env.production         # Build-time env vars for prod (VITE_API_URL="")
├── routers/                # FastAPI routers (users, budgets, goals, ...)
├── Database/               # Local SQLite path (created on first run; gitignored)
├── src/
│   ├── App.tsx             # Top-level routing / page state
│   ├── components/         # All React pages and widgets
│   ├── components/ui/      # shadcn/ui primitives
│   ├── styles/             # Global CSS
│   └── test/               # Vitest unit tests
├── tests/                  # pytest backend tests
└── .github/workflows/
    ├── build.yml           # CI: build + test on push/PR
    └── release.yml         # CD: build and push image to GHCR on release
```

## API Documentation

When the backend is running, interactive API documentation is available at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

The API exposes the following resources:

| Endpoint | Description |
|---|---|
| `/users` | User CRUD, login, signup |
| `/sessions` | Session management |
| `/roles`, `/permissions`, `/user_roles` | Role-based access primitives |
| `/budgets` | Budget CRUD |
| `/categories` | Transaction categories |
| `/templates`, `/template_items` | Budget template management |
| `/goals` | Financial goal CRUD |

## Environment Variables

| Variable | File | Used by | Purpose |
|---|---|---|---|
| `VITE_API_URL` | `.env` | Vite (dev) | Backend URL for the frontend in dev (`http://localhost:8000`) |
| `VITE_API_URL` | `.env.production` | Vite (build) | Empty string — production builds use same-origin paths since FastAPI serves the frontend |
| `DATABASE_URL` | shell / compose / deploy env | FastAPI backend | SQLAlchemy connection string. Unset → local SQLite at `Database/CalcuraV1.db`. Set to `postgresql://...`, `mysql+pymysql://...`, or `sqlite:///path` to point at any backend. |

`VITE_*` values are baked into the JS bundle at build time, not read at runtime.

## Testing

```bash
# Frontend (Vitest + React Testing Library)
npm test               # run once
npm run test:watch     # watch mode

# Backend (pytest + FastAPI TestClient)
source .venv/bin/activate
pytest tests/ -v
```

Both test suites run automatically on every push and pull request via [.github/workflows/build.yml](.github/workflows/build.yml).

## Contributors

| Name | Role |
|---|---|
| Joseph St. John | Frontend prototypes, HTML prototype |
| Emma Wikingstad | Backend (FastAPI, SQLite, routers) |
| Jaren Schneider | React frontend, UI components |
| Jaehyeong Shin | Domain prototypes, classes, admin logging |
| J. Spreckels | Signup / forgot password pages |
| Jonathan Torres | Project documentation, CI/CD, deployment infrastructure |

## Troubleshooting

**Permission denied when running `npm run dev`**

The vite binary might not have execute permissions. Run `chmod +x node_modules/.bin/*` and try again. The setup script handles this automatically.

**`.venv` or `node_modules` owned by root**

This happens if you ran the setup script or npm with `sudo`. Do not use `sudo` with npm commands. Fix it with:

```bash
sudo chown -R $(whoami):$(whoami) .venv node_modules
```

Or delete the `.venv` folder and run `bash setup.sh` again.

**Backend won't start or module not found**

Make sure you activated the virtual environment first with `source .venv/bin/activate` and installed the dependencies with `pip install -r requirements.txt`.

**Port already in use**

If the backend or frontend says the port is already in use, something is still running from last time. Find it with `lsof -i :8000` or `lsof -i :3000` and kill the process, or just restart your terminal.
