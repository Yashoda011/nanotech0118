import sqlite3

con = sqlite3.connect("nanosphere.db")
cur = con.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")]
print("TABLES:", tables)
expected = ["users", "projects", "tasks", "datasets", "activities", "notifications",
            "saved_materials", "search_history", "enrollments", "course_progress",
            "purchases", "email_tokens", "materials", "articles", "lessons",
            "glossary", "sim_runs", "tickets"]
missing = [t for t in expected if t not in tables]
print("MISSING:", missing or "none")
for t in expected:
    if t in tables:
        cols = [r[1] for r in cur.execute(f"PRAGMA table_info({t})")]
        n = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        print(f"{t}: {n} rows | cols={cols}")
# integrity + orphans
print("integrity:", cur.execute("PRAGMA integrity_check").fetchone()[0])
print("orphan projects:", cur.execute("SELECT COUNT(*) FROM projects p LEFT JOIN users u ON p.owner_id=u.id WHERE u.id IS NULL").fetchone()[0])
print("orphan enrollments:", cur.execute("SELECT COUNT(*) FROM enrollments e LEFT JOIN users u ON e.owner_id=u.id WHERE u.id IS NULL").fetchone()[0])
print("users w/o email:", cur.execute("SELECT COUNT(*) FROM users WHERE email IS NULL OR email=''").fetchone()[0])
con.close()
