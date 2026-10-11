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
            return e.code, e.read().decode()[:140]
        except Exception:
            return e.code, str(e)

def check(name, cond, extra=""):
    results.append((name, cond))
    print(("PASS" if cond else "FAIL"), name, extra)

e = "livesmoke%d@gmail.com" % int(time.time())
s, b = req("POST", "/auth/google", {"name": "Live Smoke", "email": e, "password": "secret123", "phone": "+91-9000000001"})
check("google signup via proxy", s == 201, str(s))
tok = b.get("access_token") if isinstance(b, dict) else None
s, b = req("POST", "/auth/login", {"email": e, "password": "secret123"})
check("login via proxy", s == 200 and isinstance(b, dict) and "access_token" in b, str(s))
tok = b.get("access_token") if isinstance(b, dict) else tok
s, b = req("POST", "/auth/request-code", {}, token=tok)
s, b = req("POST", "/auth/confirm-code", {"code": (b.get("dev_code") if isinstance(b, dict) else "")}, token=tok)
check("email verify via proxy", s == 200)
s, b = req("POST", "/learn/enroll", {"course_id": "nano-basics", "name": "Live Smoke", "email": e}, token=tok)
check("enroll via proxy", s in (200, 201), str(s))
s, b = req("POST", "/projects", {"name": "Live Proj", "description": "smoke", "status": "Active"}, token=tok)
check("project via proxy", s == 201, str(s))
s, b = req("POST", "/science/simulate", {"materialId": "graphene", "electricalIndex": 72, "model": "electron", "temperatureK": 300, "sizeNm": 10, "iterations": 100}, token=tok)
check("simulate via proxy", s == 200 and (b.get("quota") or {}).get("limit") == 5, str(s))
s, b = req("GET", "/billing/status", token=tok)
check("billing via proxy", s == 200 and b.get("plan") == "starter", str(s))
s, b = req("POST", "/billing/checkout-pro", {"card_last4": "4242"}, token=tok)
check("pro checkout via proxy", s == 201 and b.get("plan") == "pro", str(s))

print("LIVE ALL OK" if all(ok for _, ok in results) else "LIVE SOME FAILED")
