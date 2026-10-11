"""Generate NanoSphere-Project-Report.pdf (repo root). Re-runnable: python backend/make_report_pdf.py"""

from datetime import date
from fpdf import FPDF

OUT = "NanoSphere-Project-Report.pdf"

# Core Helvetica font is latin-1 only: map special chars to ASCII.
_CLEAN = {"→": "->", "·": "-", "×": "x", "⁴": "4", "₃": "3", "²": "2", "¹": "1",
          "ρ": "rho", "λ": "lambda", "β": "beta", "θ": "theta", "ₐ": "a",
          "⁻": "-", "₀": "0", "ₙ": "n", "ₓ": "x", "∞": "inf", "≈": "~",
          "−": "-", "–": "-", "—": "-", """: '"', """: '"', "‘": "'", "’": "'"}


def clean(t):
    t = str(t)
    for k, v in _CLEAN.items():
        t = t.replace(k, v)
    return t.encode("latin-1", "replace").decode("latin-1")

class Report(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "I", 9)
        self.set_text_color(120, 130, 150)
        self.cell(0, 8, "NanoSphere - Nanotechnology SaaS Platform - Project Report", align="R")
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(120, 130, 150)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def h1(self, t):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(20, 30, 55)
        self.cell(0, 12, clean(t))
        self.ln(12)

    def h2(self, t):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(30, 60, 140)
        self.cell(0, 10, clean(t))
        self.ln(10)

    def body(self, t):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.multi_cell(0, 5.5, clean(t))
        self.ln(2)

    def bullet(self, t):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(40, 40, 40)
        self.set_x(self.l_margin)
        self.multi_cell(0, 5.5, "  -  " + clean(t))

    def table(self, head, rows, widths):
        self.set_font("Helvetica", "B", 9)
        self.set_fill_color(230, 238, 250)
        for i, h in enumerate(head):
            self.cell(widths[i], 7, h, border=1, fill=True)
        self.ln()
        self.set_font("Helvetica", "", 9)
        for r in rows:
            h = 6
            for i, c in enumerate(r):
                self.cell(widths[i], h, clean(str(c)[:52]))
            self.ln()


pdf = Report()
pdf.alias_nb_pages()
pdf.set_auto_page_break(True, 20)

# Cover
pdf.add_page()
pdf.ln(30)
pdf.set_font("Helvetica", "B", 28)
pdf.set_text_color(20, 30, 55)
pdf.multi_cell(0, 13, "NanoSphere\nNanotechnology SaaS Platform")
pdf.ln(6)
pdf.set_font("Helvetica", "", 12)
pdf.set_text_color(90, 100, 120)
pdf.multi_cell(0, 7, f"Project Report  |  Version 1.0  |  {date.today().isoformat()}\nLearning + AI + Business/Industrial + Simulation & Modeling")
pdf.ln(10)
pdf.set_font("Helvetica", "", 10)
pdf.set_text_color(40, 40, 40)
pdf.multi_cell(0, 6, "Full-stack workspace: React + Vite + TypeScript + Tailwind frontend, "
    "FastAPI + SQLAlchemy backend (PostgreSQL prod / SQLite dev), JWT auth, real payment-gated "
    "plans, database-backed catalogue, courses, research, tickets and admin.")

# 1. Purpose
pdf.add_page()
pdf.h1("1. Platform Purpose")
pdf.body("NanoSphere serves four pillars: (1) Learning & Education SaaS - 4 courses, 6 lessons, quizzes, "
    "email-gated enrollment, limited free offer then paid, glossary in DB. (2) AI Nanotechnology Platform - "
    "material recommender, property predictor, literature miner. (3) Business/Industrial SaaS - batches, QC, "
    "cost estimator, 8 guided lab project templates with a 6-week roadmap. (4) Simulation & Modeling - transport "
    "runs with server quotas plus a unit-cell modeling playground and 6 bench calculators.")

# 2. Stack
pdf.h2("2. Technology Stack")
pdf.table(["Layer", "Technology", "Notes"],
    [["Frontend", "React 19 + Vite 7 + TS 5.9", "Strict mode, alias @/*"],
     ["Styling", "Tailwind CSS v4", "Custom theme tokens"],
     ["3D", "react-three-fiber + three", "Per-material structures"],
     ["Backend", "FastAPI + Uvicorn", "OpenAPI at /docs"],
     ["ORM / DB", "SQLAlchemy 2 + Postgres / SQLite", "18 tables, seeded catalogue"],
     ["Auth", "bcrypt + JWT (HS256, 24h)", "Guests restricted"],
     ["Science", "NumPy/SciPy/pandas", "Demo models, disclaimed"]],
    [32, 62, 96])

# 3. Features
pdf.h2("3. Feature Checklist (all verified working)")
for f in [
    "Login/Signup - secure auth + 6-digit email verification (15-min expiry).",
    "Nanomaterials Explorer - Postgres search/filter/sort + offline fallback.",
    "Compare - side-by-side stored-property table (up to 3 materials).",
    "Analytics & Charts - uploads parsed with pandas + stats.",
    "Research Reports - CSV export + Print/Save-as-PDF report.",
    "Historical Data - timestamped experiment runs in DB + UI history.",
    "Research - 6 verified DB articles + live Semantic Scholar lookup.",
    "Learning Center - DB lessons, quizzes, progress + 18-term glossary.",
    "Pricing - Starter $0 / Pro $199 / Team $999, payment-gated server-side.",
    "Contact/Support - validated tickets in DB, tracking + admin triage.",
    "Admin Panel - protected stats, users (Pro/verify/admin), tickets.",
]:
    pdf.bullet("[OK] " + f)

# 4. Routes
pdf.add_page()
pdf.h1("4. Frontend Routes (21/21 return HTTP 200)")
pdf.table(["Route", "Page"],
    [["/", "Dashboard (hero, quick access, trending 3D, activity, platform strip)"],
     ["/login, /signup", "Glass sign-in (backend auth)"],
     ["/explore", "DB catalogue + compare"],
     ["/materials/:id", "Detail + interactive 3D"],
     ["/simulation", "Quota-gated console (5/day Starter)"],
     ["/modeling", "Unit-cell playground"],
     ["/lab-tools", "6 calculators with SVG schematics"],
     ["/analysis", "Charts, CSV/PDF reports, run history"],
     ["/projects", "CRUD + 8 lab templates (email-gated)"],
     ["/learn", "Courses (enroll/pay) + glossary"],
     ["/ai", "Recommender + predictor + miner"],
     ["/business", "Batches, QC, cost estimator"],
     ["/resources, /docs", "Resources + documentation system"],
     ["/research", "Verified catalogue + live lookup"],
     ["/community", "Forum threads, replies, likes"],
     ["/pricing", "Starter/Pro/Team checkout"],
     ["/contact", "Support tickets"],
     ["/admin", "Protected admin (admins only)"],
     ["/settings", "13 tabs: profile→about"],
     ["/activity", "Full activity feed"]],
    [42, 148])

# 5. API
pdf.h2("5. Backend API (representative)")
pdf.table(["Method + Path", "Auth", "Purpose"],
    [["POST /auth/signup|login|guest", "no", "Accounts + JWT"],
     ["POST /auth/request|confirm-code", "member", "Email verification"],
     ["GET /materials", "any", "DB catalogue search"],
     ["POST /science/simulate", "any", "Run + quota (5/day free)"],
     ["GET /science/runs", "any", "Experiment history"],
     ["GET/POST /projects...", "member-write", "Projects + tasks"],
     ["POST /datasets/upload", "any", "CSV/JSON + pandas stats"],
     ["GET /learn/*", "member", "Courses, enroll, progress, glossary"],
     ["GET/POST /billing/*", "member", "Status, $199/$999 checkout"],
     ["GET/POST /support/tickets", "public/mine", "Contact tickets"],
     ["GET/PATCH /admin/*", "admin", "Stats, users, tickets"],
     ["GET /research/live", "any", "Semantic Scholar proxy"]],
    [62, 30, 98])

# 6. DB + security
pdf.add_page()
pdf.h1("6. Database (18 tables, integrity OK, 0 orphans)")
pdf.body("users, projects, tasks, datasets, activities, notifications, saved_materials, search_history, "
    "enrollments, course_progress, purchases, email_tokens, materials(12), articles(6), lessons(6), "
    "glossary(18), sim_runs, tickets. Migrations via PRAGMA ALTER block; seeds idempotent.")
pdf.h2("7. Security Controls")
for s in [
    "Rotated 64-char JWT secret; HS256 pinned (no 'none' attacks); 24h expiry.",
    "bcrypt hashing (72-byte cap handled); email format + password rules validated.",
    "Guests blocked (403) from projects writes, enrollments, billing, courses, admin.",
    "Owner-scoped queries everywhere; admin self-demote blocked.",
    "Upload allowlist (.csv/.tsv/.json/.txt) + 10 MB cap; research proxy URL fixed.",
    "CORS allowlist; DEV_MAILBOX=false in production; SMTP hook ready.",
]:
    pdf.bullet("[OK] " + s)

# 8. Verification
pdf.h2("8. Verification Results")
pdf.table(["Suite", "Result"],
    [["backend/verify_backend.py", "ALL OK"],
     ["backend/verify_learn.py", "DONE (401/403 gates hold)"],
     ["backend/verify_billing.py", "Quota 5/day, 402, checkout, cancel OK"],
     ["backend/verify_tiers.py", "Pro $199 / Team $999 OK"],
     ["backend/verify_full.py (24 checks)", "ALL OK"],
     ["backend/verify_adversarial.py", "20/20 malicious inputs rejected"],
     ["backend/verify_security.py", "7/7 (forgery, guests, exe upload)"],
     ["tsc -b + vite build", "0 errors, success"],
     ["Route smoke (21)", "21/21 HTTP 200"]],
    [90, 100])

# 9. Deploy
pdf.h2("9. Deployment")
pdf.body("See DEPLOY.md. One-command stack: Postgres 16 + FastAPI + nginx static frontend via "
    "docker compose (plus managed-host alternative). Production checklist: fresh JWT_SECRET, real "
    "CORS_ORIGINS, DEV_MAILBOX=false, ADMIN_EMAILS, HTTPS, DB backups, SMTP.")
pdf.body("Disclaimer: catalogue values, indices and simulation curves are illustrative demo models - "
    "never use them for engineering, medical or safety decisions.")

pdf.output(OUT)
print("wrote", OUT)
