import { spawn } from "node:child_process";

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      ...opts,
      shell: false,
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (d) => {
      const s = d.toString();
      stdout += s;
      process.stdout.write(s);
    });

    child.stderr.on("data", (d) => {
      const s = d.toString();
      stderr += s;
      process.stderr.write(s);
    });

    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function parseJsonLines(text) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t.startsWith("{") || !t.endsWith("}")) continue;
    try {
      rows.push(JSON.parse(t));
    } catch {}
  }
  return rows;
}

function isSoftIssue(issue) {
  const s = String(issue || "");
  return (
    s.includes("bad-internal-links:/->") &&
    /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|UND_ERR|network/i.test(s)
  );
}

function isSoftBadInternalLink(link) {
  const href = String(link?.href || "");
  const url = String(link?.url || "");
  const error = String(link?.error || "");
  const isHome = href === "/" || url === "https://fanju.app/" || url.endsWith("fanju.app/");
  const isNetwork = /fetch failed|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|UND_ERR|network/i.test(error);
  return isHome && isNetwork;
}

const result = await run("pnpm", ["seo:article:live:check"]);

if (result.code === 0) {
  process.exit(0);
}

const rows = parseJsonLines(result.stdout);
let hardFailures = 0;
let softFailures = 0;

for (const row of rows) {
  const issues = Array.isArray(row.issues) ? row.issues : [];
  const badInternalLinks = Array.isArray(row.badInternalLinks) ? row.badInternalLinks : [];

  const hardIssues = issues.filter((x) => !isSoftIssue(x));
  const hardLinks = badInternalLinks.filter((x) => !isSoftBadInternalLink(x));

  const statusBad = row.status && Number(row.status) >= 400;
  const badHits = Array.isArray(row.badHits) ? row.badHits : [];

  if (statusBad || hardIssues.length || hardLinks.length || badHits.length) {
    hardFailures++;
  } else if (issues.length || badInternalLinks.length) {
    softFailures++;
  }
}

if (rows.length > 0 && hardFailures === 0 && softFailures > 0) {
  console.warn("");
  console.warn("[SOFT PASS] Only transient homepage/internal-link fetch failures were found.");
  console.warn("[SOFT PASS] Published articles are valid, so this run will not fail.");
  process.exit(0);
}

process.exit(result.code || 1);
