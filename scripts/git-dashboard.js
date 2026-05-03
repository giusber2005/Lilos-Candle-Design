import { createServer } from "http";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 7771;

function run(bin, args = []) {
  return new Promise((res) => {
    execFile(bin, args, { cwd: ROOT }, (err, stdout, stderr) => {
      res({ ok: !err, out: (stdout + (stderr ? "\n" + stderr : "")).trim() });
    });
  });
}

async function readBody(req) {
  return new Promise((res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => res(body ? JSON.parse(body) : {}));
  });
}

function json(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Git Dashboard — Lilos Candle</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #FAF8F5;
      color: #2C2826;
      min-height: 100vh;
      padding: 32px 24px 64px;
    }
    .page { max-width: 780px; margin: 0 auto; }
    header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 20px;
      border-bottom: 1px solid #E8E3DC;
    }
    .logo { font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }
    .logo span { color: #8B8680; font-weight: 400; }
    .branch-badge {
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 12px;
      background: #2C2826;
      color: #FAF8F5;
      padding: 3px 10px;
      border-radius: 999px;
    }
    .card {
      background: #fff;
      border: 1px solid #E8E3DC;
      padding: 24px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #8B8680;
      margin-bottom: 16px;
    }
    .status-list { list-style: none; }
    .status-list li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      border-bottom: 1px solid #F0EBE3;
      font-size: 13px;
      font-family: "SF Mono", "Fira Code", monospace;
    }
    .status-list li:last-child { border-bottom: none; }
    .status-badge {
      font-size: 11px;
      font-weight: 700;
      width: 20px;
      text-align: center;
      flex-shrink: 0;
    }
    .M { color: #d97706; }
    .A { color: #16a34a; }
    .D { color: #dc2626; }
    .R { color: #7c3aed; }
    .QQ { color: #6b7280; }
    .empty-state {
      font-size: 13px;
      color: #8B8680;
      padding: 8px 0;
    }
    .commit-row {
      display: flex;
      gap: 12px;
      margin-bottom: 14px;
    }
    input[type="text"] {
      flex: 1;
      border: 1px solid #E8E3DC;
      padding: 10px 14px;
      font-size: 14px;
      color: #2C2826;
      outline: none;
      font-family: inherit;
      transition: border-color 0.15s;
    }
    input[type="text"]:focus { border-color: #8B8680; }
    .btn-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    button {
      cursor: pointer;
      border: none;
      font-family: inherit;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 10px 18px;
      transition: background 0.15s, opacity 0.15s;
    }
    button:disabled { opacity: 0.45; cursor: not-allowed; }
    .btn-primary { background: #2C2826; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #3C3835; }
    .btn-accent { background: #7C6B8A; color: #fff; }
    .btn-accent:hover:not(:disabled) { background: #6B5A79; }
    .btn-outline { background: transparent; color: #2C2826; border: 1px solid #E8E3DC; }
    .btn-outline:hover:not(:disabled) { border-color: #2C2826; }
    .btn-danger { background: transparent; color: #dc2626; border: 1px solid #fca5a5; }
    .btn-danger:hover:not(:disabled) { background: #fef2f2; }
    pre {
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 12px;
      line-height: 1.7;
      background: #F0EBE3;
      padding: 16px;
      white-space: pre-wrap;
      word-break: break-all;
      color: #2C2826;
      min-height: 48px;
    }
    pre.error { background: #fef2f2; color: #dc2626; }
    pre.success { background: #f0fdf4; color: #16a34a; }
    .log-list { list-style: none; }
    .log-list li {
      display: flex;
      gap: 12px;
      padding: 7px 0;
      border-bottom: 1px solid #F0EBE3;
      font-size: 13px;
      align-items: baseline;
    }
    .log-list li:last-child { border-bottom: none; }
    .log-hash {
      font-family: "SF Mono", "Fira Code", monospace;
      font-size: 11px;
      color: #7C6B8A;
      flex-shrink: 0;
    }
    .log-msg { color: #2C2826; }
    .spinner {
      display: inline-block;
      width: 12px; height: 12px;
      border: 2px solid #E8E3DC;
      border-top-color: #2C2826;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .refresh-btn {
      font-size: 11px;
      font-weight: 500;
      color: #8B8680;
      background: none;
      border: none;
      text-transform: none;
      letter-spacing: 0;
      padding: 0;
      cursor: pointer;
      text-decoration: underline;
    }
    .refresh-btn:hover { color: #2C2826; }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .card-header .card-title { margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="page">
    <header>
      <div class="logo">Git Dashboard <span>— Lilos Candle</span></div>
      <div id="branch" class="branch-badge">loading…</div>
    </header>

    <!-- Status -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Changed files</div>
        <button class="refresh-btn" onclick="loadStatus()">Refresh</button>
      </div>
      <ul id="status-list" class="status-list">
        <li><span class="empty-state">Loading…</span></li>
      </ul>
    </div>

    <!-- Commit -->
    <div class="card">
      <div class="card-title">Commit &amp; Push</div>
      <div class="commit-row">
        <input type="text" id="commit-msg" placeholder="Commit message…" />
      </div>
      <div class="btn-row">
        <button class="btn-outline" onclick="doStage()">Stage all</button>
        <button class="btn-outline" onclick="doCommit()">Commit</button>
        <button class="btn-outline" onclick="doPush()">Push</button>
        <button class="btn-accent" onclick="doAll()">⚡ Stage + Commit + Push</button>
      </div>
    </div>

    <!-- Output -->
    <div class="card">
      <div class="card-title">Output</div>
      <pre id="output">—</pre>
    </div>

    <!-- Log -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">Recent commits</div>
        <button class="refresh-btn" onclick="loadStatus()">Refresh</button>
      </div>
      <ul id="log-list" class="log-list">
        <li><span class="empty-state">Loading…</span></li>
      </ul>
    </div>
  </div>

  <script>
    const out = document.getElementById("output");
    const buttons = [];

    function setOutput(text, type) {
      out.textContent = text || "—";
      out.className = type === "error" ? "error" : type === "success" ? "success" : "";
    }

    function setLoading(label) {
      out.innerHTML = '<span class="spinner"></span>' + label;
      out.className = "";
    }

    function allButtons(disabled) {
      document.querySelectorAll("button:not(.refresh-btn)").forEach(b => b.disabled = disabled);
    }

    async function post(url, body) {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    }

    async function loadStatus() {
      const data = await fetch("/api/status").then(r => r.json()).catch(() => null);
      if (!data) return;

      document.getElementById("branch").textContent = data.branch || "unknown";

      const list = document.getElementById("status-list");
      if (!data.status) {
        list.innerHTML = '<li><span class="empty-state">Nothing to commit — working tree clean</span></li>';
      } else {
        const lines = data.status.split("\\n").filter(Boolean);
        list.innerHTML = lines.map(line => {
          const code = line.substring(0, 2).trim();
          const file = line.substring(3);
          const cls = code === "??" ? "QQ" : code.charAt(0);
          return \`<li><span class="status-badge \${cls}">\${code === "??" ? "?" : code}</span><span>\${file}</span></li>\`;
        }).join("");
      }

      const logList = document.getElementById("log-list");
      if (!data.log) {
        logList.innerHTML = '<li><span class="empty-state">No commits yet</span></li>';
      } else {
        const lines = data.log.split("\\n").filter(Boolean);
        logList.innerHTML = lines.map(line => {
          const hash = line.substring(0, 7);
          const msg = line.substring(8);
          return \`<li><span class="log-hash">\${hash}</span><span class="log-msg">\${msg}</span></li>\`;
        }).join("");
      }
    }

    async function doStage() {
      allButtons(true);
      setLoading("Staging all changes…");
      const r = await post("/api/add", {});
      setOutput(r.out || "Done", r.ok ? "success" : "error");
      allButtons(false);
      loadStatus();
    }

    async function doCommit() {
      const msg = document.getElementById("commit-msg").value.trim();
      if (!msg) { setOutput("Please enter a commit message.", "error"); return; }
      allButtons(true);
      setLoading("Committing…");
      const r = await post("/api/commit", { message: msg });
      setOutput(r.out || "Done", r.ok ? "success" : "error");
      allButtons(false);
      loadStatus();
    }

    async function doPush() {
      allButtons(true);
      setLoading("Pushing to remote…");
      const r = await post("/api/push", {});
      setOutput(r.out || "Done", r.ok ? "success" : "error");
      allButtons(false);
      loadStatus();
    }

    async function doAll() {
      const msg = document.getElementById("commit-msg").value.trim();
      if (!msg) { setOutput("Please enter a commit message.", "error"); return; }
      allButtons(true);
      setLoading("Staging all changes…");
      const add = await post("/api/add", {});
      if (!add.ok) { setOutput(add.out, "error"); allButtons(false); return; }

      setLoading("Committing…");
      const commit = await post("/api/commit", { message: msg });
      if (!commit.ok) { setOutput(commit.out, "error"); allButtons(false); return; }

      setLoading("Pushing to remote…");
      const push = await post("/api/push", {});
      setOutput([add.out, commit.out, push.out].filter(Boolean).join("\\n\\n"), push.ok ? "success" : "error");
      allButtons(false);
      document.getElementById("commit-msg").value = "";
      loadStatus();
    }

    loadStatus();
  </script>
</body>
</html>`;

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(HTML);
    return;
  }

  if (req.method === "GET" && req.url === "/api/status") {
    const [branch, status, log] = await Promise.all([
      run("git", ["rev-parse", "--abbrev-ref", "HEAD"]),
      run("git", ["status", "--short"]),
      run("git", ["log", "--oneline", "-8"]),
    ]);
    json(res, { branch: branch.out, status: status.out, log: log.out });
    return;
  }

  if (req.method === "POST") {
    const body = await readBody(req);

    if (req.url === "/api/add") {
      json(res, await run("git", ["add", "-A"]));
      return;
    }

    if (req.url === "/api/commit") {
      const msg = (body.message || "Update").trim();
      json(res, await run("git", ["commit", "-m", msg]));
      return;
    }

    if (req.url === "/api/push") {
      json(res, await run("git", ["push"]));
      return;
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\n  Git Dashboard → http://localhost:${PORT}\n`);
  console.log("  Press Ctrl+C to stop.\n");
});
