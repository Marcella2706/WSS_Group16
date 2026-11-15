import type { ReactNode } from "react";

/**
 * Shared layout for both the vulnerable and patched DevHub Docs search
 * pages, so the only meaningful difference between the two builds is the
 * one line of encoding logic in app/vulnerable/page.tsx vs
 * app/patched/page.tsx — not the surrounding UI. The <form>, its `action`/
 * `method`, the `q` input, and the result slot below are structurally
 * identical between variants; only their visual styling differs here.
 */
export default function SearchShell({
  variant,
  query,
  children,
}: {
  variant: "vulnerable" | "patched";
  query: string;
  children?: ReactNode;
}) {
  const action = variant === "vulnerable" ? "/vulnerable" : "/patched";

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[var(--foreground)] flex items-center justify-center text-[var(--background)] text-sm font-semibold">
              D
            </div>
            <span className="font-serif text-lg tracking-tight">
              DevHub Docs
            </span>
          </a>
          <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
            <a href="/vulnerable" className="hover:text-[var(--foreground)] transition-colors">
              Search
            </a>
            <a href="/patched" className="hover:text-[var(--foreground)] transition-colors">
              Secure search
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-sm text-[var(--muted)] mb-5">
          Search across all of your project&apos;s documentation instantly.
        </p>

        <form action={action} method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder='Search docs… e.g. "async await"'
            autoComplete="off"
            className="flex-1 rounded-lg bg-white border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 transition-opacity px-5 py-2.5 text-sm font-medium"
          >
            Search
          </button>
        </form>

        <div className="mt-6 min-h-[3rem]">{children}</div>
      </main>
    </div>
  );
}
