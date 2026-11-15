# DevForge — CSRF Privilege-Escalation Demo

A small developer-team portal built to demonstrate a **Cross-Site Request Forgery
(CSRF)** vulnerability and its mitigation.

**Scenario.** DevForge is a team portal with projects, a team feed, and an
admin-only area (a secrets vault, user management, and an audit log). `mallory`,
an ordinary developer, posts a tempting "free JetBrains licences" link in the team
feed. When `alice` (an admin) clicks it while logged in, the page silently forges a
POST that **promotes `mallory` to ADMIN** — stored in Postgres and logged against
`alice`. `mallory` then signs in and reads every production secret.

- **Variant:** CSRF → **POST-based forged action (auto-submitting form)**
- **Stack:** Next.js (frontend) · Spring Boot + Spring Security (backend) · Postgres

---

## Ownership declaration (Table 3)

| Member | GitHub | Vulnerability category | Variant implemented |
|--------|--------|------------------------|---------------------|
| **Saumya** | **Marcella2706** | **CSRF** | **POST-based forged action (auto-submitting form)** |
| _(member 2)_ | _(github)_ | _(category)_ | _(variant)_ |
| _(member 3)_ | _(github)_ | _(category)_ | _(variant)_ |
| _(member 4)_ | _(github)_ | _(category)_ | _(variant)_ |

> This repository documents **Saumya's** variant. Other members fill in their rows.

---

## Running it

**1. Start Postgres**
```bash
docker compose up -d
```

**2. Start the backend (vulnerable mode is the default)**
```bash
cd backend
mvn spring-boot:run
```
Backend runs on `http://localhost:8080`.

**3. Start the frontend**
```bash
cd frontend
npm install
npm run dev
```
Portal runs on `http://localhost:3000`.

**Demo accounts**

| User | Password | Role | Part |
|------|----------|------|------|
| `alice` | `admin123` | ADMIN | the victim (a logged-in admin) |
| `bob` | `user123` | USER | an ordinary developer |
| `mallory` | `hack123` | USER | the attacker |

---

## The exploit (what to show in the video)

### (a) Vulnerable implementation
The state-changing endpoint in
[`AppController.java`](backend/src/main/java/com/wss/csrf/controller/AppController.java)
changes a user's role over POST:

```java
@PostMapping("/admin/update-role")
public ResponseEntity<Map<String,Object>> updateRole(@RequestParam String username,
                                                      @RequestParam String role,
                                                      Principal actor) { ... }
```

In [`SecurityConfig.java`](backend/src/main/java/com/wss/csrf/config/SecurityConfig.java),
when `app.csrf.protection=false`, CSRF is **disabled**: `http.csrf(csrf -> csrf.disable())`.
The only thing gating the endpoint is the session cookie — no proof of intent.

### (b) Working exploit
1. Serve the attacker page from a different origin:
   ```bash
   cd attacker
   python3 -m http.server 5500
   ```
2. Log in to the portal as **`alice`** (admin). Open **Team Feed** — `mallory`'s post
   links to `http://localhost:5500/team-perks.html`.
3. Click the link. [`team-perks.html`](attacker/team-perks.html) looks like a perk
   page but silently submits this forged request into a hidden iframe, then redirects
   `alice` back to DevForge so nothing looks wrong:
   ```http
   POST /api/admin/update-role HTTP/1.1
   Host: localhost:8080
   Content-Type: application/x-www-form-urlencoded
   Cookie: JSESSIONID=<alice's session>      ← added automatically by the browser

   username=mallory&role=ADMIN
   ```
4. Sign in as **`mallory`** → she is now **ADMIN** and can open the **Secrets Vault**.
   The **Audit Log** records the change as done by `alice`.

### (c) Root cause
A **state-changing request is accepted with no proof of intent**. The server trusts
the ambient session cookie, which the browser attaches to *any* request to the site —
including one forged by a page the user never meant to interact with.

---

## (d) Mitigation implemented — a custom anti-CSRF (synchronizer) token

Spring's built-in CSRF support is left disabled; the defence is implemented by hand in
[`CsrfTokenFilter.java`](backend/src/main/java/com/wss/csrf/security/CsrfTokenFilter.java)
so the logic is fully ours. Restart the backend with it enabled:
```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments=--app.csrf.protection=true
```

A random token is generated with `SecureRandom`, stored in the user's session, and
handed to the frontend via `GET /api/csrf`. The filter then rejects any state-changing
request (POST/DELETE, except login/logout) whose `X-CSRF-TOKEN` header doesn't match the
session token (compared in constant time):

```java
String expected = session == null ? null : (String) session.getAttribute(SESSION_ATTR);
String actual   = req.getHeader(HEADER);
if (expected == null || actual == null || !constantTimeEquals(expected, actual)) {
    res.sendError(HttpServletResponse.SC_FORBIDDEN, "CSRF token missing or invalid");
    return;
}
```

- The **legitimate** Next.js app reads the token from `GET /api/csrf` and sends it in the
  `X-CSRF-TOKEN` header → its requests succeed.
- The **attacker's** `team-perks.html` cannot read the token (it lives on another
  origin; the same-origin policy blocks cross-origin reads, and a plain `<form>` cannot
  set a custom header). Its forged POST arrives **without the token** → it is rejected:

```
HTTP/1.1 403 Forbidden     (same payload now fails — screenshot this for item d)
```

Re-run the exploit from step (b): `mallory` stays a `USER`.

---

### A note on CORS (common confusion)

CORS is **not** a CSRF defence. CORS only decides whether JavaScript may *read* a
cross-origin response — it does not stop a browser from *sending* an auto-submitting
`<form>` POST and attaching the session cookie. This backend therefore keeps CORS
permissive on purpose, so the forged request genuinely reaches the handler and the
**anti-CSRF token** is shown to be the real control (not an incidental origin check).

## (e) Other CSRF mitigations (theory)

- **SameSite cookies.** Marking the session cookie `SameSite=Strict`/`Lax` tells the
  browser not to attach it to cross-site requests, so a forged POST from another site
  arrives with no session and is treated as unauthenticated. (This lab runs same-site
  on `localhost`, so SameSite=Lax still allows it — hence the token is the real fix.)
- **Re-authentication for sensitive actions.** Requiring the user to re-enter their
  password (or a step-up/MFA prompt) before a high-impact action means an attacker
  who only has the ambient cookie cannot complete it.
- **Avoid state-changing GET requests.** GETs are trivially forgeable (`<img>`, links).
  Keeping all mutations on POST/PUT/DELETE guarded by a token removes that easy vector.

All of these work by forcing the request to carry **something an attacker's page
cannot supply** — a token it can't read, a cookie the browser won't send cross-site,
or a fresh credential — i.e. *proof the user actually intended the action*.
