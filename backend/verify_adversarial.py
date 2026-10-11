import urllib.request, urllib.error, json, time

base = "http://127.0.0.1:8000"
ok = fail = 0

def req(method, path, body=None, token=None, raw=None, ctype="application/json"):
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    h = {}
    if data is not None:
        h["Content-Type"] = ctype
    if token:
        h["Authorization"] = "Bearer " + token
    r = urllib.request.Request(base + path, data=data, headers=h, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            try:
                return resp.status, json.load(resp)
            except Exception:
                return resp.status, None
    except urllib.error.HTTPError as e:
        return e.code, None
    except Exception as e:
        return "CONN", str(e)[:80]

def check(name, cond):
    global ok, fail
    if cond:
        ok += 1
        print("PASS", name)
    else:
        fail += 1
        print("FAIL", name)

em = "adv%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "A", "email": em, "password": "secret123"})
tok = b["access_token"] if isinstance(b, dict) and "access_token" in b else None
check("signup 201", s == 201)

s, _ = req("POST", "/auth/signup", {"name": "A", "email": em, "password": "secret123"})
check("duplicate signup 400", s == 400)
s, _ = req("POST", "/auth/signup", {"name": "", "email": "bad", "password": "123"})
check("invalid signup 422", s == 422)
s, _ = req("POST", "/auth/login", {"email": em, "password": "wrongpass"})
check("wrong password 401", s == 401)
s, _ = req("POST", "/auth/login", {"email": "nouser@x.io", "password": "secret123"})
check("unknown user 401", s == 401)
s, _ = req("GET", "/auth/me")
check("no token 401/403", s in (401, 403))
s, _ = req("GET", "/auth/me", token="garbage")
check("garbage token 401", s == 401)

# validation / not found
s, _ = req("POST", "/science/simulate",
           {"materialId": "graphene", "electricalIndex": 72, "model": "nope",
            "temperatureK": 300, "sizeNm": 10, "iterations": 100}, tok)
check("bad model 422", s == 422)
s, _ = req("POST", "/science/simulate",
           {"materialId": "graphene", "electricalIndex": 72, "model": "electron",
            "temperatureK": -5, "sizeNm": 10, "iterations": 100}, tok)
check("negative temp 422", s == 422)
s, _ = req("POST", "/projects", {"name": "", "description": "", "status": "Active"}, tok)
check("empty project name 422", s == 422)
s, _ = req("PATCH", "/projects/does-not-exist", {"name": "X"}, tok)
check("missing project 404", s == 404)
s, _ = req("POST", "/learn/enroll", {"course_id": "nope", "name": "A", "email": em}, tok)
check("bad course 404", s == 404)
s, _ = req("POST", "/learn/checkout", {"course_id": "nano-basics", "card_last4": "12"}, tok)
check("bad card 422", s == 422)
s, _ = req("POST", "/auth/confirm-code", {"code": "   "}, tok)
check("blank code rejected (422 validation)", s == 422)
s, _ = req("POST", "/auth/confirm-code", {"code": "    "}, tok)
check("whitespace code rejected (400 invalid)", s == 400)
s, _ = req("POST", "/support/tickets", {"name": "A", "email": "bad", "subject": "Hi", "message": "short"})
check("bad ticket 422", s == 422)
s, _ = req("GET", "/materials/does-not-exist", token=tok)
check("missing material 404", s == 404)
s, _ = req("GET", "/research/articles/does-not-exist", token=tok)
check("missing article 404", s == 404)
s, _ = req("GET", "/research/live?q=ab", token=tok)
check("short live query 422", s == 422)
s, _ = req("POST", "/billing/checkout-pro", {"card_last4": "abcd"}, tok)
check("bad card billing 422", s == 422)

print("ADVERSARIAL: %d pass, %d fail" % (ok, fail))
