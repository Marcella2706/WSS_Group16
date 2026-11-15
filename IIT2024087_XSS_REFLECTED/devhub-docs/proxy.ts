import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Demo session-cookie plumbing for the Reflected XSS lab.
 *
 * /vulnerable — cookie has NO HttpOnly flag, so injected JavaScript can
 *   read it via document.cookie. This is exactly what the exploit payload
 *   exfiltrates to the local attacker-listener in the demo.
 *
 * /patched — cookie is HttpOnly (JS cannot read it at all), demonstrated
 *   live alongside the required output-encoding fix as defense-in-depth.
 *
 * Note on CSP: a Content-Security-Policy header is covered in the
 * README/video as one of the *other* (theory-only) XSS mitigations per
 * assignment item (e), rather than wired up live here — a strict CSP
 * without a per-request nonce also blocks Next.js's own inline
 * hydration/streaming scripts, and nonce-based CSP is incompatible with
 * this route's Partial Prerendering (per Next.js's own CSP guide). The
 * assignment only requires one implemented mitigation; output encoding is
 * it, with HttpOnly as an extra demonstrated layer.
 *
 * (Named `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the
 * middleware file convention to `proxy`.)
 */
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/vulnerable")) {
    response.cookies.set("session_id", "test_user_8492", {
      path: "/",
      httpOnly: false, // ⚠️ intentionally insecure — lab demo only
    });
  }

  if (pathname.startsWith("/patched")) {
    response.cookies.set("session_id", "test_user_8492", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/vulnerable/:path*", "/patched/:path*"],
};
