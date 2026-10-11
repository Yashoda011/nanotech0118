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

# guest
s, g = req("POST", "/auth/guest")
gtok = g["access_token"]
s1, b1 = req("GET", "/learn/courses", token=gtok)
print("guest courses ->", s1, "(expect 403)")
s2, b2 = req("POST", "/learn/enroll", {"course_id": "nano-basics", "name": "G", "email": "g@x.io"}, token=gtok)
print("guest enroll ->", s2, "(expect 403)")

# member
email = "learn%d@x.io" % int(time.time())
s, b = req("POST", "/auth/signup", {"name": "Learner", "email": email, "password": "secret123"})
tok = b["access_token"]
s, c = req("GET", "/learn/courses", token=tok)
print("member courses ->", s, "count:", len(c["courses"]), "offer_active:", c["courses"][0]["offer_active"])
s, e = req("POST", "/learn/enroll", {"course_id": "nano-basics", "name": "Learner", "email": email}, token=tok)
print("member enroll ->", s, e.get("course_id") if isinstance(e, dict) else e)
s, p = req("POST", "/learn/progress", {"course_id": "nano-basics", "lesson_id": "nb1", "done": True, "score": 100}, token=tok)
print("progress save ->", s, p)
s, gp = req("GET", "/learn/progress/nano-basics", token=tok)
print("progress get ->", s, gp)
# progress without enrollment should 403
s, e2 = req("POST", "/auth/signup", {"name": "L2", "email": "learn2%d@x.io" % int(time.time()), "password": "secret123"})
s, p2 = req("POST", "/learn/progress", {"course_id": "nano-basics", "lesson_id": "nb1", "done": True}, token=e2["access_token"])
print("progress w/o enroll ->", s, "(expect 403)")
# unauthenticated
s, u = req("GET", "/learn/courses")
print("no token courses ->", s, "(expect 401/403)")
print("DONE")
