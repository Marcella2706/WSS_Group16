import { Suspense } from "react";
import SearchShell from "@/components/SearchShell";
import { escapeHtml } from "@/lib/escapeHtml";

// searchParams is only read inside <PatchedResults>, behind a Suspense
// boundary, as Cache Components (nextConfig.cacheComponents) requires for
// a route that reads request-specific data like a query string.
export default function PatchedSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<SearchShell variant="patched" query="" />}>
      <PatchedResults searchParams={searchParams} />
    </Suspense>
  );
}

async function PatchedResults({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = typeof raw === "string" ? raw : "";

  // ──────────────────────────────────────────────────────────────────
  // ✅ MITIGATION IMPLEMENTED (assignment item (d)) — context-aware
  // output encoding.
  //
  // This is the SAME sink (dangerouslySetInnerHTML) as the vulnerable
  // build, so the exploit payload is identical — only this one line
  // differs. `escapeHtml()` converts every HTML-significant character
  // (<, >, &, ", ') into its safe entity BEFORE the string is inserted,
  // so the browser renders it as inert text instead of parsing it as
  // markup/script. The same <script> payload that executed on
  // /vulnerable now shows up on screen as literal text.
  //
  // Defense-in-depth (not the required single mitigation, but also
  // implemented here and worth showing): the session cookie set in
  // proxy.ts for this route carries HttpOnly, so even if an XSS sink
  // were missed elsewhere, injected JS still cannot read document.cookie.
  //
  // Content-Security-Policy is covered as a *theory-only* mitigation in
  // the README/video (assignment item (e)) rather than wired up live —
  // see the note in proxy.ts for why.
  // ──────────────────────────────────────────────────────────────────
  const safeQ = escapeHtml(q);
  const resultHtml = q ? `Showing results for: ${safeQ}` : "";

  return (
    <SearchShell variant="patched" query={q}>
      {resultHtml && (
        <div
          className="rounded-lg bg-white border border-[var(--border)] px-4 py-3 text-sm font-mono break-words"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: resultHtml }}
        />
      )}
    </SearchShell>
  );
}
