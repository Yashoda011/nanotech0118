import urllib.request, urllib.error, json, time

base = "http://127.0.0.1:8000"
results = []

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    h = {"Content-Type": "application/json"} if body is not None else {}
    if token:
        h["Authorization"] = "Bearer " + token
    r = urllib.request.Request(base + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode()[:160]
        except Exception:
            detail = str(e)
        return e.code, detail

def check(name, cond, extra=""):
    results.append((name, cond))
    print(("PASS" if cond else "FAIL"), name, extra)

email = "full%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "Full", "email": email, "password": "secret123"})
tok = b["access_token"]
check("signup", s == 201)
check("user flags", b["user"].get("email_verified") is False and b["user"].get("is_admin") is False)

# verify flow
s, r = req("POST", "/auth/request-code", {}, token=tok)
check("request-code", s == 200 and r.get("sent") is True)
s, inbox = req("GET", "/auth/dev-inbox", token=tok)
code = inbox.get("code", "") if s == 200 else ""
check("dev-inbox", s == 200 and len(code) == 6, code)
s, c = req("POST", "/auth/confirm-code", {"code": "000000"}, token=tok)
check("wrong code rejected", s == 400)
s, c = req("POST", "/auth/confirm-code", {"code": code}, token=tok)
check("confirm-code", s == 200 and c.get("verified") is True)
s, me = req("GET", "/auth/me", token=tok)
check("me verified", s == 200 and me.get("email_verified") is True)

# materials
s, m = req("GET", "/materials?q=graphene", token=tok)
check("materials search", s == 200 and m["total"] >= 1 and m["source"] == "database", str(m.get("total")))
s, m = req("GET", "/materials?category=Oxide&sort=bandgap", token=tok)
check("materials filter+sort", s == 200 and m["total"] == 2)
s, one = req("GET", "/materials/mos2", token=tok)
check("material detail", s == 200 and one["name"] == "Molybdenum Disulfide")

# research
s, a = req("GET", "/research/articles", token=tok)
check("articles", s == 200 and a["total"] == 6, str(a.get("total")))
s, live = req("GET", "/research/live?q=graphene+battery", token=tok)
check("live lookup", s in (200, 502), "status %s" % s)

# glossary + lessons
s, g = req("GET", "/learn/glossary?q=scherrer", token=tok)
check("glossary", s == 200 and g["total"] >= 1)
s, e = req("POST", "/learn/enroll", {"course_id": "nano-basics", "name": "Full", "email": email}, token=tok)
check("enroll", s in (200, 201))
s, le = req("GET", "/learn/lessons/nano-basics", token=tok)
check("lessons db", s == 200 and len(le["lessons"]) == 2 and len(le["lessons"][0]["body"]) >= 2)

# runs history
sim = {"materialId": "mos2", "electricalIndex": 16, "model": "thermal", "temperatureK": 400, "sizeNm": 20, "iterations": 100}
s, r = req("POST", "/science/simulate", sim, token=tok)
check("simulate", s == 200)
s, h = req("GET", "/science/runs", token=tok)
check("runs history", s == 200 and any(x["materialId"] == "mos2" for x in h["runs"]))

# tickets
s, t = req("POST", "/support/tickets", {"name": "Full", "email": email, "subject": "Help with XRD", "message": "How do I read FWHM from my diffractogram export?"})
check("ticket create (public)", s == 201)
s, mine = req("GET", "/support/tickets/mine", token=tok)
check("tickets mine", s == 200 and len(mine["tickets"]) >= 1)

# admin: non-admin blocked
s, blocked = req("GET", "/admin/stats", token=tok)
check("admin blocked non-admin", s == 403)
s, ab = req("POST", "/auth/signup", {"name": "Admin", "email": "admin@nanosphere.io", "password": "secret123"})
atok = ab["access_token"] if s in (200, 201) else None
if not atok:
    s, ab = req("POST", "/auth/login", {"email": "admin@nanosphere.io", "password": "secret123"})
    atok = ab.get("access_token")
s, stats = req("GET", "/admin/stats", token=atok)
check("admin stats", s == 200 and stats.get("users", 0) >= 2, str(stats))
s, users = req("GET", "/admin/users", token=atok)
check("admin users", s == 200 and len(users["users"]) >= 1)
s, tk = req("GET", "/admin/tickets", token=atok)
check("admin tickets", s == 200 and len(tk["tickets"]) >= 1)
if tk["tickets"]:
    tid = tk["tickets"][0]["id"]
    s, cl = req("POST", "/admin/tickets/%s/close" % tid, {}, token=atok)
    check("admin close ticket", s == 200)

print("ALL OK" if all(ok for _, ok in results) else "SOME FAILED")
