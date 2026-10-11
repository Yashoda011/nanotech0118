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
            raw = resp.read()
            if not raw:
                return resp.status, None
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        try:
            detail = e.read().decode()[:140]
        except Exception:
            detail = str(e)
        return e.code, detail

def check(name, cond, extra=""):
    results.append((name, cond))
    print(("PASS" if cond else "FAIL"), name, extra)

email = "own%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "Owner", "email": email, "password": "secret123"})
tok = b["access_token"]
s, g = req("POST", "/auth/guest")
gtok = g["access_token"]

# batches
s, bl = req("GET", "/batches", token=tok)
check("batches list", s == 200 and isinstance(bl["batches"], list))
s, nb = req("POST", "/batches", {"name": "Lot 1", "material_id": "graphene", "kg": 5, "yield_pct": 90, "qc_pass": True}, token=tok)
check("batch create member", s == 201 and nb["name"] == "Lot 1")
s, gb = req("POST", "/batches", {"name": "Gx", "material_id": "graphene", "kg": 1, "yield_pct": 50, "qc_pass": False}, token=gtok)
check("batch create guest 403", s == 403)
s, bad = req("POST", "/batches", {"name": "", "material_id": "x", "kg": -1, "yield_pct": 500, "qc_pass": False}, token=tok)
check("batch validation 422", s == 422)
s, _ = req("DELETE", "/batches/%s" % nb["id"], token=tok)
check("batch delete", s == 204)
s, _ = req("DELETE", "/batches/nope", token=tok)
check("batch missing 404", s == 404)

# community
s, th = req("GET", "/community/threads", token=gtok)
check("threads guest-readable", s == 200 and th["total"] >= 3 and th["source"] == "database", str(th.get("total")))
s, nt = req("POST", "/community/threads", {"title": "Test thread here", "body": "Body of test thread here", "tag": "Safety"}, token=tok)
check("thread create member", s == 201 and nt["tag"] == "Safety")
s, ng = req("POST", "/community/threads", {"title": "Guest thread here", "body": "Guest body here", "tag": "General"}, token=gtok)
check("thread create guest 403", s == 403)
s, short = req("POST", "/community/threads", {"title": "ab", "body": "cd", "tag": "X"}, token=tok)
check("thread validation 422", s == 422)
s, rp = req("POST", "/community/threads/%s/replies" % nt["id"], {"text": "Nice post!"}, token=tok)
check("reply member", s == 201)
s, rg = req("POST", "/community/threads/%s/replies" % nt["id"], {"text": "Guest reply"}, token=gtok)
check("reply guest 403", s == 403)
s, l1 = req("POST", "/community/threads/%s/like" % nt["id"], {}, token=tok)
check("like on", s == 200 and l1["liked"] is True and l1["likes"] == 1)
s, l2 = req("POST", "/community/threads/%s/like" % nt["id"], {}, token=tok)
check("like toggle off", s == 200 and l2["liked"] is False and l2["likes"] == 0)
s, lg = req("POST", "/community/threads/%s/like" % nt["id"], {}, token=gtok)
check("like guest 403", s == 403)
s, miss = req("POST", "/community/threads/nope/like", {}, token=tok)
check("like missing 404", s == 404)

print("ALL OK" if all(ok for _, ok in results) else "SOME FAILED")
