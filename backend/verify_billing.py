import urllib.request, urllib.error, json, time

base = "http://127.0.0.1:8000"

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
            detail = e.read().decode()[:200]
        except Exception:
            detail = str(e)
        return e.code, detail

email = "pro%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "Pro", "email": email, "password": "secret123"})
tok = b["access_token"]
s, st = req("GET", "/billing/status", token=tok)
print("status starter ->", s, st)
s, g = req("POST", "/auth/guest")
s, gs = req("GET", "/billing/status", token=g["access_token"])
print("guest status ->", s, "(expect 403)")
sim = {"materialId": "graphene", "electricalIndex": 72, "model": "electron",
       "temperatureK": 300, "sizeNm": 10, "iterations": 100}
for i in range(6):
    s, r = req("POST", "/science/simulate", sim, token=tok)
    print(f"sim {i+1} ->", s, ("quota " + str(r.get("quota")) if s == 200 else r[:120]))
s, c = req("POST", "/billing/checkout-pro", {"card_last4": "4242"}, token=tok)
print("checkout ->", s, c)
s, st = req("GET", "/billing/status", token=tok)
print("status pro ->", s, st)
s, r = req("POST", "/science/simulate", sim, token=tok)
print("sim after pro ->", s, r.get("quota") if s == 200 else r[:120])
s, cc = req("POST", "/billing/cancel", {}, token=tok)
print("cancel ->", s, cc)
print("DONE")
