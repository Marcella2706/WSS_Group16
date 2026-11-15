"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:8080";

async function getCsrf() {
  try {
    const res = await fetch(`${API}/api/csrf`, { credentials: "include" });
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

function timeAgo(iso) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function Linkified({ text }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p}>
            {p}
          </a>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function Home() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [form, setForm] = useState({ u: "", p: "" });
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");

  const [projects, setProjects] = useState([]);
  const [feed, setFeed] = useState([]);
  const [draft, setDraft] = useState("");
  const [users, setUsers] = useState([]);
  const [secrets, setSecrets] = useState([]);
  const [revealed, setRevealed] = useState({});
  const [audit, setAudit] = useState([]);
  const [target, setTarget] = useState({ username: "", role: "USER" });

  function flash(m) {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  }

  async function refresh() {
    setLoading(true);
    const res = await fetch(`${API}/api/me`, { credentials: "include" });
    if (res.status === 401) {
      setMe(null);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setMe(data);
    await Promise.all([loadProjects(), loadFeed()]);
    if (data.role === "ADMIN") await Promise.all([loadUsers(), loadSecrets(), loadAudit()]);
    setLoading(false);
  }

  const loadProjects = async () => {
    const r = await fetch(`${API}/api/projects`, { credentials: "include" });
    if (r.ok) setProjects(await r.json());
  };
  const loadFeed = async () => {
    const r = await fetch(`${API}/api/feed`, { credentials: "include" });
    if (r.ok) setFeed(await r.json());
  };
  const loadUsers = async () => {
    const r = await fetch(`${API}/api/admin/users`, { credentials: "include" });
    if (r.ok) {
      const list = await r.json();
      setUsers(list);
      if (list.length) setTarget((t) => ({ ...t, username: t.username || list[0].username }));
    }
  };
  const loadSecrets = async () => {
    const r = await fetch(`${API}/api/admin/secrets`, { credentials: "include" });
    if (r.ok) setSecrets(await r.json());
  };
  const loadAudit = async () => {
    const r = await fetch(`${API}/api/admin/audit`, { credentials: "include" });
    if (r.ok) setAudit(await r.json());
  };

  async function deleteAudit(id) {
    const headers = {};
    const c = await getCsrf();
    if (c.token) headers[c.headerName || "X-XSRF-TOKEN"] = c.token;
    const res = await fetch(`${API}/api/admin/audit/${id}`, {
      method: "DELETE",
      credentials: "include",
      headers,
    });
    if (res.ok) loadAudit();
    else flash(`Delete failed (${res.status})`);
  }

  async function login(e) {
    e.preventDefault();
    setErr("");
    const body = new URLSearchParams();
    body.set("username", form.u);
    body.set("password", form.p);
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (res.ok) {
      setView("dashboard");
      refresh();
    } else setErr("Invalid username or password.");
  }

  async function logout() {
    await fetch(`${API}/api/logout`, { method: "POST", credentials: "include" });
    setMe(null);
    setUsers([]);
    setSecrets([]);
    setForm({ u: "", p: "" });
    setErr("");
  }

  async function postMessage() {
    if (!draft.trim()) return;
    const body = new URLSearchParams();
    body.set("text", draft);
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const c = await getCsrf();
    if (c.token) headers[c.headerName || "X-XSRF-TOKEN"] = c.token;
    const res = await fetch(`${API}/api/feed`, { method: "POST", credentials: "include", headers, body });
    if (res.ok) {
      setDraft("");
      loadFeed();
    } else flash(`Could not post (${res.status})`);
  }

  async function updateRole() {
    const body = new URLSearchParams();
    body.set("username", target.username);
    body.set("role", target.role);
    const headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const c = await getCsrf();
    if (c.token) headers[c.headerName || "X-XSRF-TOKEN"] = c.token;
    const res = await fetch(`${API}/api/admin/update-role`, {
      method: "POST",
      credentials: "include",
      headers,
      body,
    });
    if (res.ok) {
      flash(`${target.username} set to ${target.role}`);
      loadUsers();
      loadAudit();
    } else flash(`Update failed (${res.status})`);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) {
    return (
      <div className="login-screen">
        <div className="muted">Loading…</div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand-lg">
            Dev<span>Forge</span>
          </div>
          <div className="card">
            <form onSubmit={login}>
              <label>Username</label>
              <input value={form.u} onChange={(e) => setForm({ ...form, u: e.target.value })} placeholder="username" />
              <label>Password</label>
              <input
                type="password"
                value={form.p}
                onChange={(e) => setForm({ ...form, p: e.target.value })}
                placeholder="password"
              />
              <div style={{ marginTop: 16 }}>
                <button type="submit" style={{ width: "100%" }}>
                  Sign in
                </button>
              </div>
              {err && <div className="err">{err}</div>}
            </form>
            <div className="seed">
              Demo accounts: <code>alice</code>/<code>admin123</code> · <code>bob</code>/<code>user123</code> ·{" "}
              <code>mallory</code>/<code>hack123</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = me.role === "ADMIN";
  const nav = (id, ico, label) => (
    <button className={`navitem ${view === id ? "active" : ""}`} onClick={() => setView(id)}>
      <span className="ico">{ico}</span>
      {label}
    </button>
  );

  const titles = {
    dashboard: "Dashboard",
    projects: "Projects",
    feed: "Team Feed",
    secrets: "Secrets Vault",
    team: "Team Administration",
    audit: "Audit Log",
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          Dev<span>Forge</span>
        </div>
        {nav("dashboard", "▚", "Dashboard")}
        {nav("projects", "❏", "Projects")}
        {nav("feed", "✉", "Team Feed")}
        {isAdmin && (
          <>
            <div className="navgroup-label">Admin</div>
            {nav("secrets", "🔑", "Secrets Vault")}
            {nav("team", "⚙", "Team")}
            {nav("audit", "☰", "Audit Log")}
          </>
        )}
        <div className="spacer" />
        <div className="userbox">
          <div className="name">{me.username}</div>
          <div className="role">{me.email}</div>
          <div style={{ marginTop: 10 }}>
            <button className="ghost sm" onClick={logout} style={{ width: "100%" }}>
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <h1>{titles[view]}</h1>
          <div className="spacer" />
          <span className={`badge ${me.role.toLowerCase()}`}>{me.role}</span>
        </div>

        <div className="content">
          {view === "dashboard" && (
            <>
              <div className="grid stats">
                <div className="stat">
                  <div className="n">{projects.length}</div>
                  <div className="l">Projects</div>
                </div>
                <div className="stat">
                  <div className="n">{feed.length}</div>
                  <div className="l">Feed posts</div>
                </div>
                {isAdmin && (
                  <div className="stat">
                    <div className="n">{users.length}</div>
                    <div className="l">Team members</div>
                  </div>
                )}
                <div className="stat">
                  <div className="n">{me.role}</div>
                  <div className="l">Your access</div>
                </div>
              </div>
              <div className="card">
                <h2 className="sec">Recent activity</h2>
                {feed.slice(0, 3).map((m) => (
                  <div className="feed-item" key={m.id}>
                    <div className="feed-head">
                      <span className="who">{m.author}</span>
                      <span className="when">{timeAgo(m.createdAt)}</span>
                    </div>
                    <div className="feed-text">
                      <Linkified text={m.text} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 12 }}>
                  <button className="ghost sm" onClick={() => setView("feed")}>
                    Open Team Feed →
                  </button>
                </div>
              </div>
            </>
          )}

          {view === "projects" && (
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Visibility</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td>
                        <span className={`badge ${p.status}`}>{p.status}</span>
                      </td>
                      <td className="muted">{p.visibility}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "feed" && (
            <>
              <div className="card">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Share something with the team…"
                />
                <div style={{ marginTop: 10, textAlign: "right" }}>
                  <button onClick={postMessage}>Post</button>
                </div>
              </div>
              <div className="card">
                {feed.map((m) => (
                  <div className="feed-item" key={m.id}>
                    <div className="feed-head">
                      <span className="who">{m.author}</span>
                      <span className="when">{timeAgo(m.createdAt)}</span>
                    </div>
                    <div className="feed-text">
                      <Linkified text={m.text} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {view === "secrets" && isAdmin && (
            <div className="card">
              <h2 className="sec">Production secrets</h2>
              <p className="muted" style={{ marginTop: -6, marginBottom: 14 }}>
                Restricted to workspace administrators.
              </p>
              {secrets.map((s) => (
                <div className="secret-row" key={s.name}>
                  <div className="k">{s.name}</div>
                  <div className="v">{revealed[s.name] ? s.value : "•".repeat(18)}</div>
                  <span className={`badge ${s.scope === "production" ? "production" : "development"}`}>
                    {s.scope}
                  </span>
                  <button
                    className="ghost sm"
                    onClick={() => setRevealed((r) => ({ ...r, [s.name]: !r[s.name] }))}
                  >
                    {revealed[s.name] ? "Hide" : "Reveal"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {view === "team" && isAdmin && (
            <>
              <div className="card">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.username}>
                        <td>{u.username}</td>
                        <td className="muted">{u.email}</td>
                        <td>
                          <span className={`badge ${u.role.toLowerCase()}`}>{u.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h2 className="sec">Change a member&apos;s role</h2>
                <div className="row">
                  <div>
                    <label>Member</label>
                    <select
                      value={target.username}
                      onChange={(e) => setTarget({ ...target, username: e.target.value })}
                    >
                      {users.map((u) => (
                        <option key={u.username} value={u.username}>
                          {u.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Role</label>
                    <select value={target.role} onChange={(e) => setTarget({ ...target, role: e.target.value })}>
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <button onClick={updateRole}>Save</button>
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "audit" && isAdmin && (
            <div className="card">
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((a) => (
                    <tr key={a.id}>
                      <td className="muted">{timeAgo(a.createdAt)}</td>
                      <td>{a.actor}</td>
                      <td>{a.action}</td>
                      <td style={{ textAlign: "right", width: 40 }}>
                        <button
                          className="icon-del"
                          title="Delete entry"
                          aria-label="Delete entry"
                          onClick={() => deleteAudit(a.id)}
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
