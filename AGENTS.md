# AGENTS.md — NanoSphere contributor guide (human + AI agents)

Read this before touching code. Stack: Vite 7 + React 19 + TS 5.9 (strict) +
Tailwind v4 frontend; FastAPI + SQLAlchemy 2.0 backend (Postgres prod, SQLite dev).

## Paths

- Frontend source: `src/` — alias `@/*` → `./src/*`
  - Pages: `src/pages/` · shell: `src/components/shell/` · dashboard widgets:
    `src/components/dashboard/` · 3D: `src/components/material/`
  - shadcn-style drops: `src/components/ui/` (+ `pricing-utils/`)
  - API client: `src/lib/api.ts` (single place for all backend calls)
  - Global state: `src/store/app.tsx` (localStorage cache + backend sync)
- Backend: `backend/app/` — `main.py`, `config.py`, `models.py`, `schemas.py`,
  `routers/`, `seed_content.py`, `learn_data.py`
- Verify scripts: `backend/verify_*.py` · DB audit: `backend/db_audit.py`
- Deploy: `Dockerfile`, `backend/Dockerfile`, `docker-compose.yml`, `DEPLOY.md`

## Commands

```bash
# frontend dev / typecheck / build
npm run dev            # http://localhost:5173 (VITE_API_URL from .env)
npx tsc --noEmit -p tsconfig.app.json   # REAL check (root tsc checks nothing!)
npm run build && npm run preview -- --port 5173 --host --strictPort

# backend (from repo root)
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --port 8000 --host 127.0.0.1
python backend/verify_full.py   # 24-check E2E (also: verify_backend/learn/billing/tiers/adversarial/security)
python backend/db_audit.py
```

## Rules

1. **Verify, don't guess.** After any change: real `tsc -p tsconfig.app.json`
   (never bare `tsc`), `npm run build`, relevant `verify_*.py`, curl the route (200).
2. **Backend is source of truth when online.** New user data → new table +
   owner-scoped queries + router + seed if catalogue. Guests: read-only
   catalogue; writes (projects, enroll, billing, courses) are `require_member`
   (403 for guests). Every new endpoint needs a `verify_*.py` case.
3. **Frontend falls back offline.** Use `api.*` client; keep bundled/static
   fallback when `backendOnline` is false. Never hardcode URLs (use
   `VITE_API_URL` / `API_BASE` / `import.meta.env.BASE_URL` for assets).
4. **No new npm/PyPI deps without asking**, except tiny type-only ones.
5. **Lucide icons:** this repo pins an older set — `Chrome`, `History`,
   `MailLock` do NOT exist. Grep `node_modules/lucide-react/dist/lucide-react.d.ts`
   before using a new icon name (builds fail on unknown exports).
6. **JSX/TSX edits:** match exact whitespace; for tricky insertions prefer a
   temp python patch script under `backend/` and delete it after.
7. **Security invariants:** bcrypt (72B cap already handled), JWT HS256 pinned
   in `security.py`, Bearer auth on all data routes, upload allowlist
   (.csv/.tsv/.json/.txt, 10 MB), CORS allowlist, no secrets in code or git.
8. **DB migrations:** SQLite dev has no Alembic runs — extend the `PRAGMA`
   `ALTER TABLE` block in `main.py` for new columns; new tables come from
   `Base.metadata.create_all` + `seed_content.seed_all` (idempotent).
9. **Payments are mock checkout** (shape-validated only, never charged/stored)
   but entitlements (`is_pro`/`is_team`/purchases) and gates (5 sims/day,
   402) are real and server-enforced. Never gate paid features client-side only.
10. **Science values are illustrative demo models** — keep disclaimers on any
    simulation/calculator/report surface.
