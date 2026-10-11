import urllib.request, urllib.error, json, time, uuid

base = "http://127.0.0.1:8000"

def req(method, path, body=None, token=None, raw=None, headers=None):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = dict(headers or {})
    if body is not None:
        h["Content-Type"] = "application/json"
    if token:
        h["Authorization"] = "Bearer " + token
    r = urllib.request.Request(base + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            ct = resp.headers.get("Content-Type", "")
            payload = json.load(resp) if "json" in ct else resp.read()[:100]
            return resp.status, payload
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode()[:200]
        except Exception:
            detail = str(e)
        return e.code, detail

checks = []
s, b = req("GET", "/health")
checks.append(("health", s == 200 and isinstance(b, dict) and b.get("status") == "ok"))
email = "verify%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "V", "email": email, "password": "secret123"})
checks.append(("signup", s == 201))
tok = b["access_token"] if s == 201 else None
s, b2 = req("POST", "/auth/login", {"email": email, "password": "secret123"})
checks.append(("login", s == 200))
s, b = req("GET", "/auth/me", token=tok)
checks.append(("me", s == 200))
s, p = req("POST", "/projects", {"name": "P1", "description": "d", "status": "Active"}, token=tok)
checks.append(("create project", s == 201))
pid = p["id"] if s == 201 else ""
s, l = req("GET", "/projects", token=tok)
checks.append(("list projects>=1", s == 200 and len(l) >= 1))
s, t = req("POST", "/projects/" + pid + "/tasks", {"title": "T1"}, token=tok)
checks.append(("add task", s == 201))
tid = t["id"] if s == 201 else ""
s, t2 = req("PATCH", "/projects/" + pid + "/tasks/" + tid, token=tok)
checks.append(("toggle task", s == 200))
s, a = req("GET", "/workspace/activities", token=tok)
checks.append(("activities", s == 200 and len(a) >= 1))
s, n = req("GET", "/workspace/notifications", token=tok)
checks.append(("notifications", s == 200))
s, sv = req("GET", "/workspace/saved", token=tok)
checks.append(("saved", s == 200))
s, sh = req("GET", "/workspace/search-history", token=tok)
checks.append(("search-history", s == 200))
s, sm = req("POST", "/science/simulate",
            {"materialId": "graphene", "electricalIndex": 72, "model": "electron",
             "temperatureK": 300, "sizeNm": 10, "iterations": 100}, token=tok)
checks.append(("simulate", s == 200 and "peak" in sm))
s, lc = req("POST", "/science/lab-calc",
            {"calc": "scherrer", "fwhmDeg": 0.5, "thetaDeg": 20, "lambdaNm": 0.154}, token=tok)
checks.append(("lab-calc", s == 200 and lc["result"] > 0))
s, st = req("PATCH", "/workspace/settings", {"role": "Tester"}, token=tok)
checks.append(("settings", s == 200))
boundary = "----" + uuid.uuid4().hex
csv = b"label,value\nA,1\nB,2\nC,3\n"
body = (b"--" + boundary.encode() + b"\r\n"
        + b"Content-Disposition: form-data; name=\"file\"; filename=\"t.csv\"\r\n"
        + b"Content-Type: text/csv\r\n\r\n" + csv
        + b"\r\n--" + boundary.encode() + b"--\r\n")
s, d = req("POST", "/datasets/upload", raw=body, token=tok,
           headers={"Content-Type": "multipart/form-data; boundary=" + boundary})
checks.append(("dataset upload", s == 201))
s, dl = req("GET", "/datasets", token=tok)
checks.append(("list datasets", s == 200 and len(dl) >= 1))
try:
    with urllib.request.urlopen("http://localhost:5173/") as r:
        fcode = r.status
except Exception as e:
    fcode = str(e)
checks.append(("frontend 200", fcode == 200))

for name, ok in checks:
    print(("PASS" if ok else "FAIL"), name)
print("ALL OK" if all(ok for _, ok in checks) else "SOME FAILED")
