import urllib.request, urllib.error, json, time

base = "https://nanosphere-site.vercel.app/api"
results = []

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json"} if body is not None else {}
    if token:
        h["Authorization"] = "Bearer " + token
    r = urllib.request.Request(base + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r, timeout=90) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        try:
            return e.code, e.read().decode()[:160]
        except Exception:
            return e.code, str(e)
    except Exception as e:
        return "CONN", str(e)[:120]

def check(name, cond, extra=""):
    results.append((name, cond))
    print(("PASS" if cond else "FAIL"), name, extra)

s, b = req("GET", "/health")
check("health", s == 200 and isinstance(b, dict) and b.get("status") == "ok", str(b))

e = "audit%d@gmail.com" % int(time.time())
s, b = req("POST", "/auth/google", {"name": "Audit", "email": e, "password": "secret123", "phone": "+91-9000000002"})
tok = b.get("access_token") if isinstance(b, dict) else None
check("google signup", s == 201 and tok, str(s))
s, b = req("POST", "/auth/login", {"email": e, "password": "secret123"})
tok = b.get("access_token") if isinstance(b, dict) and "access_token" in b else tok
check("login", s == 200 and tok, str(s))
s, b = req("POST", "/auth/request-code", {}, token=tok)
code = b.get("dev_code") if isinstance(b, dict) else ""
check("request-code", s == 200 and bool(code), str(s))
s, b = req("POST", "/auth/confirm-code", {"code": code}, token=tok)
check("confirm-code", s == 200 and (b or {}).get("verified") is True, str(s))
s, b = req("GET", "/materials?q=graphene", token=tok)
check("materials", s == 200 and b.get("total", 0) >= 1, str(b.get("total") if isinstance(b, dict) else b))
s, b = req("GET", "/research/articles", token=tok)
check("articles", s == 200 and b.get("total", 0) == 6, str(b.get("total") if isinstance(b, dict) else b))
s, b = req("GET", "/learn/glossary?q=xrd", token=tok)
check("glossary", s == 200 and b.get("total", 0) >= 1, str(s))
s, b = req("POST", "/learn/enroll", {"course_id": "nano-basics", "name": "Audit", "email": e}, token=tok)
check("enroll", s in (200, 201), str(s))
s, b = req("GET", "/learn/lessons/nano-basics", token=tok)
check("lessons", s == 200 and len((b or {}).get("lessons", [])) == 2, str(s))
s, b = req("POST", "/learn/progress", {"course_id": "nano-basics", "lesson_id": "nb1", "done": True, "score": 100}, token=tok)
check("progress", s == 200, str(s))
s, b = req("POST", "/science/simulate", {"materialId": "graphene", "electricalIndex": 72, "model": "electron", "temperatureK": 300, "sizeNm": 10, "iterations": 100}, token=tok)
check("simulate+quota", s == 200 and isinstance(b, dict) and "peak" in b, str((b or {}).get("quota") if isinstance(b, dict) else b))
s, b = req("GET", "/science/runs", token=tok)
check("runs history", s == 200 and len((b or {}).get("runs", [])) >= 1, str(s))
s, b = req("POST", "/projects", {"name": "Audit Proj", "description": "d", "status": "Planning"}, token=tok)
pid = b.get("id") if isinstance(b, dict) else ""
check("project create", s == 201, str(s))
s, b = req("POST", "/projects/%s/tasks" % pid, {"title": "T1"}, token=tok)
check("task add", s == 201, str(s))
s, b = req("POST", "/datasets/upload", None, token=tok)
check("upload-guard", s in (400, 422), str(s))
s, b = req("POST", "/support/tickets", {"name": "Audit", "email": e, "subject": "Audit ticket here", "message": "Testing the live support flow end to end."})
check("ticket", s == 201, str(s))
s, b = req("GET", "/billing/status", token=tok)
check("billing starter", s == 200 and (b or {}).get("plan") == "starter", str(b))
s, b = req("POST", "/billing/checkout-pro", {"card_last4": "4242"}, token=tok)
check("pro checkout", s == 201, str(s))
s, b = req("POST", "/community/threads", {"title": "Live audit thread", "body": "Checking live forum write path", "tag": "General"}, token=tok)
tid = b.get("id") if isinstance(b, dict) else ""
check("thread", s == 201, str(s))
s, b = req("POST", "/batches", {"name": "Audit lot", "material_id": "graphene", "kg": 2, "yield_pct": 95, "qc_pass": True}, token=tok)
check("batch", s == 201, str(s))
s, g = req("POST", "/auth/guest", {})
gtok = g.get("access_token") if isinstance(g, dict) else None
s, _ = req("POST", "/projects", {"name": "X", "description": "", "status": "Planning"}, token=gtok)
check("guest write blocked", s == 403, str(s))
s, _ = req("GET", "/admin/stats", token=tok)
check("non-admin blocked", s == 403, str(s))

print("LIVE AUDIT:", sum(1 for _, ok in results if ok), "/", len(results),
      "ALL OK" if all(ok for _, ok in results) else "FAILURES PRESENT")
