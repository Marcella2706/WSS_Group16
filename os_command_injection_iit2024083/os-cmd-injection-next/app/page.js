"use client";
import { useState } from "react";

const card = { background: "#fff", borderRadius: 8, padding: 20, boxShadow: "0 1px 3px #0002", marginBottom: 16 };
const btn = { padding: "9px 16px", fontSize: 15, border: 0, borderRadius: 4, background: "#1f3864", color: "#fff", cursor: "pointer" };

export default function Home() {
  const [host, setHost] = useState("");
  const [message, setMessage] = useState(null);
  const [elapsed, setElapsed] = useState(null);
  const [busy, setBusy] = useState(false);

  async function ping(e) {
    e.preventDefault();
    setBusy(true);
    const t0 = performance.now();
    const r = await fetch("/api/ping", { method: "POST", body: JSON.stringify({ host }) });
    const d = await r.json();
    setElapsed(((performance.now() - t0) / 1000).toFixed(2));
    setMessage(d.message);
    setBusy(false);
  }

  return (
    <>
      <header style={{ background: "#1f3864", color: "#fff", padding: "16px 24px" }}>
        <h2 style={{ margin: 0 }}>NetTools — Host Status Checker</h2>
      </header>
      <main style={{ maxWidth: 760, margin: "24px auto", padding: "0 16px" }}>
        <div style={card}>
          <h3>Check if a host is up</h3>
          <form onSubmit={ping}>
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="e.g. 127.0.0.1" autoFocus
              style={{ width: "70%", padding: 9, fontSize: 15, border: "1px solid #bbb", borderRadius: 4, marginRight: 8 }} />
            <button style={btn} disabled={busy}>{busy ? "Checking…" : "Check"}</button>
          </form>
          {message !== null && (
            <p style={{ fontSize: 17 }}>
              <b>{message}</b>
              <span style={{ marginLeft: 12, color: "#555" }}>Response time: <b>{elapsed}s</b></span>
            </p>
          )}
        </div>
      </main>
    </>
  );
}
