---
title: "Cookie crumbs: session forgery in three acts"
tag: web
date: 2026-05-30
ctf: picoCTF 2026
read: 5 min
---

Weak signing, predictable session IDs, and a flag hiding in an admin panel nobody linked to. A three-act web challenge that rewarded reading the cookies closely.

## Act I — The suspicious cookie

After logging in, the app set a session cookie that looked base64-ish:

```
session=eyJ1c2VyIjoiZ3Vlc3QiLCJyb2xlIjoidXNlciJ9.c2ln
```

Decoding the first segment revealed plain JSON:

```json
{ "user": "guest", "role": "user" }
```

The second segment was a **signature** — and that's where act two begins.

## Act II — Breaking the signature

The signature was an HMAC, but the server leaked its algorithm in a verbose error. Worse, the secret was short enough to brute-force:

```python
import hmac, hashlib, itertools, string
target = bytes.fromhex(sig_hex)
for length in range(1, 6):
    for guess in itertools.product(string.ascii_lowercase, repeat=length):
        key = ''.join(guess).encode()
        if hmac.new(key, body, hashlib.sha256).digest() == target:
            print("key:", key)
```

> The secret was `pico`. Four characters. Never ship a four-character HMAC key.

## Act III — The hidden panel

With a forged `role: admin` cookie, I re-requested the dashboard — but the flag wasn't there. A quick look at the JS bundle revealed a route the UI never rendered:

```js
// bundle.min.js, line ~4200
const ADMIN_ROUTES = ["/admin", "/admin/flag"];
```

Hitting `/admin/flag` with the forged cookie returned the flag directly.

## Lessons

- **Sign, then verify properly** — leaking your algorithm is half the break.
- Short secrets die to brute force in seconds.
- Unlinked routes are not access control. Read the bundle.
