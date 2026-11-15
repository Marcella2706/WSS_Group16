export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-[var(--foreground)] flex items-center justify-center text-[var(--background)] text-sm font-semibold">
              D
            </div>
            <span className="font-serif text-lg tracking-tight">
              DevHub Docs
            </span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
            <a href="/vulnerable" className="hover:text-[var(--foreground)] transition-colors">
              Search
            </a>
            <a href="/patched" className="hover:text-[var(--foreground)] transition-colors">
              Secure search
            </a>
          </nav>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-24 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/60 px-3 py-1 text-xs text-[var(--muted)] mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
          New · instant search across your docs
        </div>

        <h1 className="font-serif text-5xl leading-[1.08] tracking-tight mb-6">
          Documentation that
          <br />
          finally <em className="italic text-[var(--accent)]">keeps up.</em>
        </h1>

        <p className="text-[var(--muted)] text-lg leading-relaxed max-w-md mb-10">
          DevHub Docs indexes every page the moment it&apos;s written, so
          the answer is always one search away — no more stale wikis or
          outdated runbooks.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/vulnerable"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] text-[var(--background)] px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started
            <span aria-hidden>→</span>
          </a>
          <a
            href="/patched"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-medium hover:border-[var(--foreground)] transition-colors"
          >
            View live demo
          </a>
        </div>
      </main>

      <section className="border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-14 grid sm:grid-cols-2 gap-6">
          <a
            href="/vulnerable"
            className="group rounded-2xl border border-[var(--border)] bg-white p-6 hover:border-[var(--accent)] transition-colors"
          >
            <span className="inline-block rounded-full bg-blue-50 text-blue-700 text-xs font-mono px-2.5 py-1 mb-4">
              v1
            </span>
            <h2 className="font-serif text-xl mb-2">Instant search</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              Type a query and see results immediately, pulled straight from
              the docs index as you type.
            </p>
          </a>
          <a
            href="/patched"
            className="group rounded-2xl border border-[var(--border)] bg-white p-6 hover:border-[var(--accent)] transition-colors"
          >
            <span className="inline-block rounded-full bg-emerald-50 text-emerald-700 text-xs font-mono px-2.5 py-1 mb-4">
              v2
            </span>
            <h2 className="font-serif text-xl mb-2">Secure search</h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              The same experience, hardened for production — every result is
              sanitized before it reaches the page.
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
