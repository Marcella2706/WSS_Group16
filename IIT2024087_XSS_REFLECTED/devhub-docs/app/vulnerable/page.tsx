import { Suspense } from "react";
import SearchShell from "@/components/SearchShell";

// searchParams is only read inside <VulnerableResults>, behind a Suspense
// boundary, as Cache Components (nextConfig.cacheComponents) requires for
// a route that reads request-specific data like a query string.
export default function VulnerableSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<SearchShell variant="vulnerable" query="" />}>
      <VulnerableResults searchParams={searchParams} />
    </Suspense>
  );
}

async function VulnerableResults({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = typeof raw === "string" ? raw : "";

  // ──────────────────────────────────────────────────────────────────
  // ⚠️ VULNERABLE CODE PATH — Reflected XSS (assignment item (a)).
  //
  // `q` comes straight from the URL query string (untrusted, attacker
  // controlled) and is concatenated directly into an HTML string with
  // NO output encoding, then handed to React's dangerouslySetInnerHTML.
  // The browser has no way to tell "page markup" apart from
  // "attacker-controlled markup" here, so a payload such as
  //   <script>...document.cookie...</script>
  // is parsed and EXECUTED as if it were part of the page itself.
  //
  // Root cause (item (c)): user input is rendered into the page without
  // any encoding/escaping step between "untrusted input" and "HTML sink".
  // ──────────────────────────────────────────────────────────────────
  const resultHtml = q ? `Showing results for: ${q}` : "";

  return (
    <SearchShell variant="vulnerable" query={q}>
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
