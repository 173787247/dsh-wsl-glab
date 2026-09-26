import { spawn } from "node:child_process";

export function which(cmd) {
  const safe = String(cmd || "").replace(/[^a-zA-Z0-9._+-]/g, "");
  if (!safe) return Promise.resolve("");
  return new Promise((r) => {
    const child = spawn("bash", ["-lc", `command -v ${safe}`], { stdio: ["ignore", "pipe", "ignore"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.on("close", (c) => r(c === 0 ? out.trim() : ""));
  });
}

export function run(bin, args, { timeoutMs = 30_000, maxOut = 80_000, env } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, ...(env || {}) },
    });
    let stdout = "";
    let stderr = "";
    const t = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("timeout"));
    }, timeoutMs);
    child.stdout.on("data", (d) => {
      stdout += d;
      if (stdout.length > maxOut * 2) child.kill("SIGKILL");
    });
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      clearTimeout(t);
      resolvePromise({
        code,
        stdout: stdout.slice(0, maxOut),
        stderr: stderr.slice(0, 4000),
        truncated: stdout.length > maxOut,
      });
    });
    child.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

const WRITE = new Set([
  "mr",
  "issue",
  "release",
  "repo",
  "label",
  "milestone",
  "snippet",
  "schedule",
  "variable",
  "securefile",
  "deploy-key",
  "ssh-key",
  "token",
  "user",
  "alias",
  "config",
  "auth",
  "api",
  "ci",
]);

// Read-ish glab verbs we expose as dedicated tools; block generic shell-out of write commands.
export async function glabStatus() {
  const glab = (await which("glab")) || null;
  if (!glab) return { ok: true, glab: null, version: null, auth: null };
  let version = null;
  let auth = null;
  try {
    const ver = await glabVersion({ timeoutMs: 8_000 });
    version = ver.output || null;
  } catch {
    /* ignore */
  }
  try {
    const r = await run(glab, ["auth", "status"], { timeoutMs: 10_000, maxOut: 8_000 });
    // Strip anything that looks like a token; keep host/user lines only
    const lines = (r.stdout || r.stderr || "")
      .split("\n")
      .map((l) => l.replace(/(token|oauth|pat)[^\s]*/gi, "[redacted]"))
      .filter((l) => l.trim() && !/ghp_|glpat-|gho_|ghu_/i.test(l))
      .slice(0, 20);
    auth = {
      exitCode: r.code,
      loggedIn: r.code === 0 || /Logged in to/i.test(lines.join("\n")),
      summary: lines.join("\n").slice(0, 1500),
    };
  } catch (e) {
    auth = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true, glab, version, auth };
}

export async function glabVersion({ timeoutMs } = {}) {
  const bin = (await which("glab")) || "glab";
  const r = await run(bin, ["version"], { timeoutMs: timeoutMs || 10_000, maxOut: 5_000 });
  return { ok: true, output: (r.stdout || r.stderr).trim() };
}

export async function glabMrList({ state = "opened", limit = 20, repo, timeoutMs, maxOut = 40_000 } = {}) {
  const bin = (await which("glab")) || "glab";
  const n = Math.min(50, Math.max(1, Number(limit) || 20));
  const args = ["mr", "list", "--per-page", String(n), "-F", "json"];
  const st = String(state || "opened");
  if (!/^(opened|closed|merged|all)$/.test(st)) throw new Error("invalid mr state");
  if (st !== "all") args.push("--state", st);
  if (repo) {
    if (!/^[A-Za-z0-9._/-]+$/.test(repo)) throw new Error("invalid repo");
    args.push("-R", repo);
  }
  const r = await run(bin, args, { timeoutMs, maxOut });
  if (r.code !== 0) throw new Error(`glab mr list failed: ${r.stderr || r.code}`);
  let items;
  try {
    items = JSON.parse(r.stdout || "[]");
  } catch {
    return { ok: true, raw: r.stdout, truncated: r.truncated };
  }
  const list = (Array.isArray(items) ? items : []).slice(0, n).map((m) => ({
    iid: m.iid,
    title: m.title,
    state: m.state,
    web_url: m.web_url,
    source_branch: m.source_branch,
    target_branch: m.target_branch,
  }));
  return { ok: true, count: list.length, mrs: list };
}

export async function glabCiStatus({ repo, timeoutMs, maxOut = 40_000 } = {}) {
  const bin = (await which("glab")) || "glab";
  const args = ["ci", "status"];
  if (repo) {
    if (!/^[A-Za-z0-9._/-]+$/.test(repo)) throw new Error("invalid repo");
    args.push("-R", repo);
  }
  const r = await run(bin, args, { timeoutMs, maxOut });
  // ci status may exit non-zero when failed — still return output
  return {
    ok: true,
    exitCode: r.code,
    truncated: r.truncated,
    output: (r.stdout || r.stderr).trim(),
  };
}

export async function glabIssueList({ state = "opened", limit = 20, repo, timeoutMs, maxOut = 40_000 } = {}) {
  const bin = (await which("glab")) || "glab";
  const n = Math.min(50, Math.max(1, Number(limit) || 20));
  const args = ["issue", "list", "--per-page", String(n), "-F", "json"];
  const st = String(state || "opened");
  if (!/^(opened|closed|all)$/.test(st)) throw new Error("invalid issue state");
  if (st !== "all") args.push("--state", st);
  if (repo) {
    if (!/^[A-Za-z0-9._/-]+$/.test(repo)) throw new Error("invalid repo");
    args.push("-R", repo);
  }
  const r = await run(bin, args, { timeoutMs, maxOut });
  if (r.code !== 0) throw new Error(`glab issue list failed: ${r.stderr || r.code}`);
  let items;
  try {
    items = JSON.parse(r.stdout || "[]");
  } catch {
    return { ok: true, raw: r.stdout };
  }
  const list = (Array.isArray(items) ? items : []).slice(0, n).map((i) => ({
    iid: i.iid,
    title: i.title,
    state: i.state,
    web_url: i.web_url,
  }));
  return { ok: true, count: list.length, issues: list };
}

void WRITE;
