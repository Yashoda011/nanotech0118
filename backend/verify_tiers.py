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
            detail = e.read().decode()[:160]
        except Exception:
            detail = str(e)
        return e.code, detail

email = "tier%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "T", "email": email, "password": "secret123"})
tok = b["access_token"]
s, st = req("GET", "/billing/status", token=tok)
print("status ->", s, st)
assert st["plan"] == "starter" and st["pro_price_cents"] == 19900 and st["team_price_cents"] == 99900
s, c = req("POST", "/billing/checkout-team", {"card_last4": "9999"}, token=tok)
print("team checkout ->", s, c)
s, st = req("GET", "/billing/status", token=tok)
print("status team ->", s, st)
sim = {"materialId": "graphene", "electricalIndex": 72, "model": "electron",
       "temperatureK": 300, "sizeNm": 10, "iterations": 100}
s, r = req("POST", "/science/simulate", sim, token=tok)
print("team sim ->", s, r.get("quota"))
email2 = "tier2%d@x.io" % int(time.time())
s, b2 = req("POST", "/auth/signup", {"name": "T2", "email": email2, "password": "secret123"})
tok2 = b2["access_token"]
s, c2 = req("POST", "/billing/checkout-pro", {"card_last4": "4242"}, token=tok2)
print("pro checkout ->", s, c2)
s, st2 = req("GET", "/billing/status", token=tok2)
print("status pro ->", s, st2)
print("DONE")
