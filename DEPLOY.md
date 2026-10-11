# Deploying NanoSphere — YES, it is deploy-ready.

Final sweep status: backend suites ALL OK (auth/learn/billing/tiers/full +
20/20 adversarial), DB 18/18 tables integrity ok, `tsc -b` clean, build clean,
21/21 routes 200.

## Option A — VPS with Docker (recommended, ~10 min)

Requirements: any Ubuntu VPS, Docker + Compose plugin, a domain (or IP).

```bash
git clone <your-repo> nanosphere && cd nanosphere
cp .env.prod.example .env.prod
# edit .env.prod: POSTGRES_PASSWORD, JWT_SECRET
#   (python3 -c "import secrets; print(secrets.token_hex(32))"),
#   CORS_ORIGINS=https://YOUR-DOMAIN, VITE_API_URL=https://api.YOUR-DOMAIN
docker compose --env-file .env.prod up -d --build
```

What you get: Postgres (persistent `pgdata` volume) + FastAPI on :8000 +
static frontend on :80 (nginx, SPA fallback, 30-day asset cache).
Tables + catalogue seeds (12 materials, 6 articles, 6 lessons, 18 glossary
terms) auto-create on first boot. Put a reverse proxy (Caddy/Nginx +
Let's Encrypt) in front for HTTPS — **do not serve login traffic over HTTP.**

## Option B — Managed hosts (no Docker)

- **Frontend** → Vercel / Netlify / Cloudflare Pages: root `C:\Users\acer\nanosphere-site`,
  build `npm run build`, output `dist`, env `VITE_API_URL=https://<api-host>`.
- **Backend** → Render / Railway / Fly: root `backend/`,
  build `pip install -r requirements.txt`, start
  `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Database** → managed Postgres; set `DATABASE_URL=postgresql+psycopg2://…`,
  `CORS_ORIGINS=https://<frontend-host>`, `DEV_MAILBOX=false`.

## Production checklist (must-do)

1. `JWT_SECRET` — fresh 64-hex value (never reuse the local one).
2. `CORS_ORIGINS` — only your real domain(s).
3. `DEV_MAILBOX=false` — disables the demo verification-code inbox.
4. `ADMIN_EMAILS` — your real admin address (first login grants admin).
5. Backups — snapshot the `pgdata` volume / managed-DB backups on.
6. Email — wire SMTP for verification codes (code path has a `TODO production`
   hook in `backend/app/routers/verify.py`).
7. JWT lives in localStorage (demo-standard) — for high-security needs, move
   to httpOnly cookies + CSRF tokens.

## Smoke test after deploy

- `GET /health` → `{"status":"ok","db":"postgresql"}`
- Open `/login` → sign up → verify email → enroll in a course → run a
  simulation → check `/admin` (as admin) shows the new user.
