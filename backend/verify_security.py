import urllib.request, urllib.error, json, uuid

base = "http://127.0.0.1:8000"

env = open("backend/.env").read()
print("1. JWT placeholder gone:", "change-me" not in env)

r = urllib.request.Request(base + "/auth/me", headers={"Authorization": "Bearer forged.token.here"})
try:
    urllib.request.urlopen(r)
    print("2. forged token: ACCEPTED (BAD)")
except urllib.error.HTTPError as e:
    print("2. forged token rejected:", e.code == 401)

g = json.load(urllib.request.urlopen(urllib.request.Request(
    base + "/auth/guest", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")))
gt = g["access_token"]

def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(base + path, data=data,
                               headers={"Content-Type": "application/json", "Authorization": "Bearer " + gt},
                               method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code

print("3. guest project-write:", call("POST", "/projects", {"name": "X", "description": "", "status": "Planning"}), "(want 403)")
print("4. guest enroll:", call("POST", "/learn/enroll", {"course_id": "nano-basics", "name": "G", "email": "g@x.io"}), "(want 403)")
print("5. guest billing:", call("GET", "/billing/status"), "(want 403)")
print("6. guest admin:", call("GET", "/admin/stats"), "(want 403)")

bnd = "----" + uuid.uuid4().hex
payload = (b"--" + bnd.encode() + b"\r\n"
           + b'Content-Disposition: form-data; name="file"; filename="x.exe"\r\n'
           + b"Content-Type: text/plain\r\n\r\nhi\r\n--" + bnd.encode() + b"--\r\n")
r = urllib.request.Request(base + "/datasets/upload", data=payload,
                           headers={"Content-Type": "multipart/form-data; boundary=" + bnd,
                                     "Authorization": "Bearer " + gt}, method="POST")
try:
    urllib.request.urlopen(r)
    print("7. exe upload: ACCEPTED (BAD)")
except urllib.error.HTTPError as e:
    print("7. exe upload blocked:", e.code == 400)
print("DONE")
