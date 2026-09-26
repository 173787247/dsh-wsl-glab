import { glabStatus, glabMrList, glabCiStatus, glabIssueList } from "./lib/glab.js";

export const name = "dsh-wsl-glab";
export const inject = ["tools", "systemPrompt"];

export function apply(ctx, config = {}) {
  if (config.enabled === false) {
    console.log("[dsh-wsl-glab] disabled");
    return;
  }
  const timeoutMs = positive(config.timeoutMs, 30_000);
  console.log("[dsh-wsl-glab] read-only list tools (mr/issue/ci status)");

  ctx.systemPrompt.section({
    name: "tool:glab",
    order: 124,
    text: "dsh-wsl-glab wraps GitLab CLI (glab) for read-only MR/issue lists and ci status. Complements dsh-wsl-github. Does not create/merge MRs. Auth via glab's own config — never paste tokens into chat.",
  });

  ctx.tools.register({
    name: "glab_status",
    description: "Whether glab is on PATH; version + auth status summary (never returns tokens).",
    parameters: { type: "object", additionalProperties: false, properties: {} },
    output: { schema: { type: "object", additionalProperties: true }, render: (_a, v) => [{ type: "text", text: JSON.stringify(v, null, 2) }] },
    timeoutMs: 15_000,
    isConcurrencySafe: () => true,
    async execute() {
      return glabStatus();
    },
    presentCall: () => ({ card: "generic", title: "glab status" }),
    presentResult: (_a, r) => ({ card: "generic", title: "glab status", content: r.content }),
  });

  ctx.tools.register({
    name: "glab_mr_list",
    description: "List merge requests (json summary). Optional repo path group/project.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        state: { type: "string" },
        limit: { type: "number" },
        repo: { type: "string" },
      },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text:
            v.ok === false
              ? v.error
              : (v.mrs || []).map((m) => `!${m.iid} ${m.state} ${m.title}\n${m.web_url}`).join("\n\n") ||
                v.raw ||
                "(none)",
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await glabMrList({ ...args, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "glab mr list" }),
    presentResult: (_a, r) => ({ card: "generic", title: "glab mr list", content: r.content }),
  });

  ctx.tools.register({
    name: "glab_issue_list",
    description: "List issues (json summary).",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        state: { type: "string" },
        limit: { type: "number" },
        repo: { type: "string" },
      },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [
        {
          type: "text",
          text:
            v.ok === false
              ? v.error
              : (v.issues || []).map((i) => `#${i.iid} ${i.state} ${i.title}\n${i.web_url}`).join("\n\n") || "(none)",
        },
      ],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await glabIssueList({ ...args, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "glab issue list" }),
    presentResult: (_a, r) => ({ card: "generic", title: "glab issue list", content: r.content }),
  });

  ctx.tools.register({
    name: "glab_ci_status",
    description: "glab ci status for current pipeline (read-only summary text).",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: { repo: { type: "string" } },
    },
    output: {
      schema: { type: "object", additionalProperties: true },
      render: (_a, v) => [{ type: "text", text: v.ok === false ? v.error : v.output }],
    },
    timeoutMs,
    isConcurrencySafe: () => true,
    async execute(args) {
      try {
        return await glabCiStatus({ repo: args?.repo, timeoutMs });
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    },
    presentCall: () => ({ card: "generic", title: "glab ci" }),
    presentResult: (_a, r) => ({ card: "generic", title: "glab ci", content: r.content }),
  });
}

function positive(v, fb) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fb;
}
