#!/usr/bin/env node
// Generates a T3 Code harness tree of pstack, mirroring upstream's scripts/generate-pstack-harness-trees.mjs.

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ADAPTER_TEMPLATE = join(HERE, "..", "adapter", "t3-code.md");
const SKILL_TEMPLATES = join(HERE, "..", "adapter", "skills");
const ADAPTER = "docs/harness/t3-code.md";
const GUIDE = "docs/guide";
const MARKER = "SOURCE.json";
const PREFIX = "pstack-";
const GITHUB = "https://github.com/cursor/plugins";
const LINK = /\]\(([^)\s]+)\)/g;

// Upstream's TERMS, copied so the adapter covers every Cursor name the Claude Code adapter covers.
const UPSTREAM_TERMS = [
  { key: "`Task`", re: /`Task`|\bTask (tool|subagent|call)/ },
  { key: "`AskQuestion`", re: /AskQuestion/ },
  { key: "todolist", re: /\btodo ?list\b/i },
  { key: "generalPurpose", re: /generalPurpose/ },
  { key: "poteto-agent", re: /poteto-agent/ },
  { key: "comment-sicko", re: /comment-sicko/ },
  { key: "`readonly: true`", re: /readonly: (true|false)|readonly\/Ask/ },
  { key: '`environment: "cloud"`', re: /environment: "(cloud|local)"/ },
  { key: "cloud_base_branch", re: /cloud_base_branch/ },
  { key: "`run_in_background: true`", re: /run_in_background/ },
  { key: "`resume`", re: /`resume`/ },
  { key: "`file_attachments`", re: /file_attachments/ },
  { key: "claude-", re: /\bclaude-[a-z]+-\d/ },
  { key: "grok-", re: /\bgrok-\d/ },
  { key: "gpt-", re: /\bgpt-\d/ },
  { key: "inherit-parent", re: /inherit-parent/ },
  { key: "pstack-models.mdc", re: /pstack-models\.mdc/ },
  { key: ".cursor/skills/", re: /\.cursor\/skills/ },
  { key: "~/.cursor/plugins/", re: /\.cursor\/plugins|\.cursor-plugin/ },
  { key: ".cursor/rules/", re: /\.cursor\/rules|always-applied rule/ },
  { key: "agent-transcripts", re: /agent-transcripts|\.cursor\/projects/ },
  {
    key: "Cursor-only features",
    re: /Bugbot|Cursor [Aa]utomation|cursor\.(sh|com)\/automations|[Cc]loud [Aa]gent|built-in PR tool/,
  },
];

// Mechanics that conflict with T3 Code's orchestration instructions, which upstream's Claude Code adapter does not cover.
const T3_TERMS = [
  { key: "Cursor's `/loop`", re: /`\/loop`|\/loop\b/ },
  { key: "`scripts/watch-pr/watch-pr`", re: /watch-pr/ },
  { key: "`control-ui` or `control-cli`", re: /control-ui|control-cli|control skill/ },
  { key: "`deslop`", re: /deslop/ },
  { key: "`create-skill`", re: /\bcreate-skill\b/ },
  { key: "`SendToUser`", re: /SendToUser/ },
  { key: "Custom modes", re: /[Cc]ustom [Mm]ode/ },
  { key: "the Project tracker", re: /Project tracker|Project store|root agent's store/ },
  { key: "`scripts/worktree-audit.sh`", re: /worktree-audit/ },
];

const TERMS = [...UPSTREAM_TERMS, ...T3_TERMS];
const ROUTE_KEY = "Run another pstack skill";
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Skills in the README's table that get no launcher, with the reason. They stay readable in the tree.
const UNEXPOSED = {
  "automate-me": "Builds Cursor Automations, which T3 Code does not run.",
  "make-bot-ui": "Builds a UI for Cursor Automation webhooks and `update_state`, which T3 Code does not run.",
};

// Judgment notes for the generated mapping, where the term scan alone would mislead.
const NOTES = {
  "poteto-mode": "Router. T3 Subagent routing and Model policy govern role settings, documentation, and independent reviews.",
  "setup-pstack": "Writes the T3 model rule file named in the adapter, from `orchestrator_capabilities`, instead of a Cursor rule.",
  arena: "Candidates run as `delegate_task` with `isolation: \"worktree\"`. Select one cross-judge from the configured pool, from a family other than the coordinator's. If none is eligible, report the limitation and ask; do not silently skip or substitute.",
  interrogate: "Adversaries get a committed or `git stash create` SHA, never a dirty tree. See the adapter's Moving commits.",
  swarm: "Writers and SHA-checking workers use worktree delegates. Results are read after T3's completion wake, never polled.",
  why: "Discovers MCP servers at run time. In T3 Code that is whatever the provider session has connected.",
  recall: "Transcript reads map to `t3_thread_read` and `t3_thread_search` first, then raw provider logs.",
  reflect: "Transcript and skill paths map per the adapter's Paths section.",
  "show-me-your-work": "Trail paths map per the adapter's Paths section.",
  "create-verification-skill": "Writes project skills to `.agents/skills/` with a `.claude/skills/` symlink.",
};

const PLAYBOOK_NOTES = {
  babysit: "Waits become `watch_pull_request`. `watch-pr --status-only` stays for one-shot status.",
  shipping: "Verifiers are worktree delegates that did not write the code. Merges stay in the root.",
  "autopilot-full": "Owners never watch PRs in T3 Code. The root watches and spawns a fresh owner round per wake.",
  "autopilot-stack": "Same owner and watch split as Autopilot-full.",
  orchestrate: "Workers are `delegate_task` children. The program store is under the repository's git common dir.",
  "autonomous-run": "`/loop` maps to completion wakes, `watch_pull_request`, `/goal`, or `schedule_task`.",
  "session-pickup": "Prior trails come from `t3_thread_read` before raw transcripts.",
  "opening-a-pr": "No built-in PR tool. `gh` or Origin, then `link_pull_request`.",
  "worktree-cleanup": "T3 owns thread and delegate worktrees. The in-use set comes from `t3_worktree_list` and `t3_thread_list`, never the audit alone.",
  "bug-fix": "Same-surface repro uses the project's driver. A surface no driver reaches is INCONCLUSIVE, never a pass.",
};

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === ".DS_Store" || name === "node_modules") return [];
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function file(path) {
  return { bytes: readFileSync(path), executable: (statSync(path).mode & 0o111) !== 0 };
}

function text(bytes) {
  return { bytes: Buffer.from(bytes), executable: false };
}

function frontmatter(source) {
  return source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
}

function frontmatterField(source, field) {
  const lines = frontmatter(source).split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${field}:`));
  if (start === -1) return undefined;
  const end = lines.findIndex((line, i) => i > start && /^[A-Za-z0-9_-]+:/.test(line));
  return lines.slice(start, end === -1 ? undefined : end).join("\n");
}

export function locateUpstream(upstream) {
  const root = resolve(upstream);
  if (existsSync(join(root, "pstack", "plugin.json"))) return { root, pstack: join(root, "pstack") };
  if (existsSync(join(root, "plugin.json"))) return { root: dirname(root), pstack: root };
  throw new Error(`${upstream} holds neither pstack/plugin.json nor plugin.json`);
}

// Keys from upstream's TERMS array, read as text so no upstream code runs.
export function upstreamTermKeys(root) {
  const script = join(root, "scripts", "generate-pstack-harness-trees.mjs");
  if (!existsSync(script)) return undefined;
  const block = readFileSync(script, "utf8").match(/const TERMS = \[([\s\S]*?)\n\];/)?.[1];
  if (!block) return undefined;
  return [...block.matchAll(/key: (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/g)].map(([, dq, sq]) =>
    dq !== undefined ? JSON.parse(`"${dq}"`) : sq.replace(/\\'/g, "'"),
  );
}

// Skill names in the README's "all skills" table, the set upstream presents as user-facing commands.
export function readmeSkills(readme) {
  const block = readme.match(/<summary>all skills<\/summary>([\s\S]*?)<\/details>/)?.[1];
  if (!block) return undefined;
  return [...block.matchAll(/^\| \[`\/([a-z0-9-]+)`\]\(\.\/skills\/\1\/SKILL\.md\)/gm)].map(([, name]) => name);
}

function gitHead(dir) {
  try {
    return execFileSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

function launcher({ name, description, manualOnly, version, pstackDir }) {
  const skillDir = `${pstackDir}/skills/${name}`;
  return `---
name: ${PREFIX}${name}
${description}
${manualOnly ? "disable-model-invocation: true\n" : ""}---

# ${PREFIX}${name}

Launcher for the pstack \`${name}\` skill (pstack ${version}) under T3 Code.

1. If you have not read it in this session, read \`${pstackDir}/${ADAPTER}\`. It maps pstack's Cursor names to T3 Code tools, and its rules win over pstack's where they conflict.
2. Read \`${skillDir}/SKILL.md\` and follow it for this request, with the user's message as its input. Resolve the skill's relative paths against \`${skillDir}/\`.
`;
}

const OPENAI_YAML = `policy:
  allow_implicit_invocation: false
`;

function mappingTable(rows) {
  return rows.map((cells) => `| ${cells.join(" | ")} |`).join("\n");
}

function t3Markdown(path, source, { outDir, models, skills }) {
  const fill = (value) => value.replaceAll("{{PSTACK}}", outDir).replaceAll("{{MODELS}}", resolve(models));
  const skill = path.match(/^skills\/([^/]+)\/SKILL\.md$/)?.[1];
  const override = skill && join(SKILL_TEMPLATES, `${skill}.md`);
  if (override && existsSync(override)) source = fill(readFileSync(override, "utf8"));
  if (skill === "poteto-mode") {
    source = source.replace(/## Subagents\n[\s\S]*?(?=\n## |$)/, fill(readFileSync(join(HERE, "..", "adapter", "subagents.md"), "utf8")) + "\n");
  }

  const policy = `Resolve provider, model, effort, and unavailable choices through [T3 Model policy](${outDir}/${ADAPTER}#model-policy) and \`${resolve(models)}\`. `;
  const routing = {
    how: ["Every spawn is a Task subagent", policy + "Explorers use `how explorer`; explanatory writers use `documentation` / `how explainer`. Exploration is read-only."],
    why: ["Each spawn below names a role line", policy + "Use `why investigators` for probes and `why synthesizer` for investigative synthesis."],
    reflect: ["Each reviewer and the synthesizer name a role line", policy + "Use the role table below for these learning-analysis lenses; independent artifact reviews use the reciprocal review policy."],
    architect: ["Take the runners from", policy + "Use the exact `architect runners` list. One agent per entry; T3 owns each writing candidate's worktree."],
  };
  if (routing[skill]) {
    const [prefix, replacement] = routing[skill];
    source = source.split("\n\n").map((paragraph) => paragraph.startsWith(prefix) ? replacement : paragraph).join("\n\n");
  }
  if (skill === "arena") {
    source = source.replace(/^3\. Pick the runners\..*$/m, "3. " + policy + "Use the exact `arena runners` list, one candidate per entry. Confirm model availability before launching; preserve the configured count.");
    source = source.replace(/^After all Phase B candidates complete,.*$/m, "After all Phase B candidates complete, " + policy + "select one eligible entry from `arena cross-judge pool` in order, from a family other than the coordinator's. The read-only judge sees the rubric and candidate paths, scores criteria, and recommends a base. Start it only after candidates stop writing. Follow its completion wake; do other independent work while it runs.");
  }
  if (skill === "swarm") source = source.replace(/^3\. Pick the worker model.*$/m, "3. " + policy + "Use `swarm workers`, unless the user explicitly assigns models per race arm. Keep worker count scoped to the task.");

  if (!path.includes("/references/")) source = source
    .replace(/\(default `(?:grok-4\.7-xhigh-fast|claude-opus-5-5-xhigh)`\)/g, "(fallback per T3 Model policy)")
    .replace(/`(?:grok-4\.7-xhigh-fast|claude-opus-5-5-xhigh)`/g, "`inherit-parent` (only when no role or worker default is saved)");
  source = source
    .replaceAll("~/.cursor/rules/pstack-models.mdc", resolve(models))
    .replaceAll("pstack-models.mdc", resolve(models))
    .replaceAll("~/.cursor/skills/", "~/.agents/skills/")
    .replaceAll(".cursor/skills/", ".agents/skills/");
  const commands = new RegExp(`(?<![a-zA-Z0-9_./:-])/(${skills.join("|")})(?![a-zA-Z0-9_/-])`, "g");
  return source.replace(commands, (_, name) => `$${PREFIX}${name}`);
}

export function build({ upstream, out, models }) {
  const { root, pstack } = locateUpstream(upstream);
  const skillsDir = join(pstack, "skills");
  const outDir = resolve(out);
  const problems = [];

  const known = new Set(UPSTREAM_TERMS.map(({ key }) => key));
  const upstreamKeys = upstreamTermKeys(root);
  if (upstreamKeys) {
    for (const key of upstreamKeys) {
      if (!known.has(key)) problems.push(`upstream adapter term ${JSON.stringify(key)} is not in UPSTREAM_TERMS`);
    }
  }

  const template = readFileSync(ADAPTER_TEMPLATE, "utf8");
  const adapter = template.replaceAll("{{PSTACK}}", outDir).replaceAll("{{MODELS}}", resolve(models));
  const skills = readdirSync(skillsDir).filter((name) => existsSync(join(skillsDir, name, "SKILL.md")));

  const classes = new Map();
  for (const skill of skills) {
    const dir = join(skillsDir, skill);
    const others = skills.filter((name) => name !== skill).join("|");
    const route = new RegExp(`the \\*\\*(?<bold>${others})\\*\\* skill|\`/(?<command>${others})\``, "g");
    const linksToSkill = (line, name) => line.includes(`(../${name}/`);
    const namesBareSkill = (line) =>
      [...line.matchAll(route)].some(({ groups }) => !linksToSkill(line, groups.bold ?? groups.command));
    const uses = new Set();
    for (const path of walk(dir).filter((path) => path.endsWith(".md"))) {
      const body = readFileSync(path, "utf8");
      for (const term of TERMS) if (term.re.test(body)) uses.add(term.key);
      if (body.split("\n").some(namesBareSkill)) uses.add(ROUTE_KEY);
    }
    const source = readFileSync(join(dir, "SKILL.md"), "utf8");
    const name = frontmatterField(source, "name")?.replace(/^name:/, "").trim().replace(/^(["'])(.*)\1$/, "$2");
    if (name !== skill) problems.push(`skills/${skill}/SKILL.md has name ${JSON.stringify(name ?? "")}, not ${skill}`);
    if (!SKILL_NAME.test(skill) || skill.length + PREFIX.length > 64) problems.push(`skills/${skill} cannot take the ${PREFIX} prefix`);
    const wrap = uses.size > 0 && /^# /m.test(source);
    if (uses.size > 0 && !wrap) problems.push(`skills/${skill}/SKILL.md uses Cursor names but has no H1`);
    classes.set(skill, { uses, wrap, source });
  }

  const users = new Map();
  for (const [skill, { uses }] of classes) for (const key of uses) users.set(key, [...(users.get(key) ?? []), skill]);
  for (const [key, using] of users) {
    if (!adapter.includes(key)) problems.push(`T3 Code adapter has no row for ${key}, used by ${using.join(", ")}`);
  }

  const readme = readFileSync(join(pstack, "README.md"), "utf8");
  const listed = readmeSkills(readme);
  if (!listed) problems.push("README.md has no 'all skills' table to choose launchers from");
  const exposed = [...new Set([...(listed ?? []), "poteto-mode", "setup-pstack"])].filter(
    (name) => classes.has(name) && !(name in UNEXPOSED),
  );
  for (const name of listed ?? []) if (!classes.has(name)) problems.push(`README.md lists /${name}, which has no SKILL.md`);
  for (const name of Object.keys(UNEXPOSED)) if (!classes.has(name)) problems.push(`UNEXPOSED names ${name}, which upstream no longer ships`);

  if (problems.length > 0) return { problems };

  const copies = [...walk(skillsDir), ...walk(join(pstack, "agents")), ...walk(join(pstack, GUIDE)), join(pstack, "README.md")];
  const files = new Map(copies.map((path) => [relative(pstack, path), file(path)]));
  files.set("LICENSE", file(join(pstack, "LICENSE")));
  files.set("plugin.json", file(join(pstack, "plugin.json")));
  files.set(ADAPTER, text(adapter));

  const adapterPath = join(outDir, ADAPTER);
  const line =
    `In T3 Code, read [the T3 Code adapter](${adapterPath}) once per session before you follow this skill. ` +
    "It maps the Cursor names in pstack skills to T3 Code tools, and its rules win where they conflict.";
  for (const [skill, { wrap }] of classes) {
    const path = `skills/${skill}/SKILL.md`;
    if (wrap) files.get(path).bytes = Buffer.from(files.get(path).bytes.toString("utf8").replace(/^(# .*)\n+/m, `$1\n\n${line}\n\n`));
  }

  for (const [path, entry] of files) {
    if (!path.endsWith(".md") || path === ADAPTER) continue;
    entry.bytes = Buffer.from(t3Markdown(path, entry.bytes.toString("utf8"), { outDir, models, skills: exposed }));
  }

  const resolveLink = (from, href) => {
    const target = href.replace(/[#?].*/, "");
    if (!target || target.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(target)) return undefined;
    const path = posix.join(posix.dirname(from), target).replace(/\/$/, "");
    return existsSync(join(pstack, path)) ? path : undefined;
  };
  const has = (path) => files.has(path) || [...files.keys()].some((key) => key.startsWith(`${path}/`));
  for (const [path, entry] of files) {
    if (!path.endsWith(".md") || path === ADAPTER) continue;
    entry.bytes = Buffer.from(
      entry.bytes.toString("utf8").replace(LINK, (link, href) => {
        const target = resolveLink(path, href);
        if (!target || target.split("/")[0] === ".." || has(target)) return link;
        const kind = statSync(join(pstack, target)).isDirectory() ? "tree" : "blob";
        return `](${GITHUB}/${kind}/main/pstack/${target}${href.slice(href.search(/[#?]|$/))})`;
      }),
    );
  }

  const version = JSON.parse(readFileSync(join(pstack, "plugin.json"), "utf8")).version;
  for (const name of exposed) {
    const source = files.get(`skills/${name}/SKILL.md`).bytes.toString("utf8");
    const description = frontmatterField(source, "description");
    const manualOnly = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter(source));
    files.set(`launchers/${PREFIX}${name}/SKILL.md`, text(launcher({ name, description, manualOnly, version, pstackDir: outDir })));
    if (manualOnly) files.set(`launchers/${PREFIX}${name}/agents/openai.yaml`, text(OPENAI_YAML));
  }

  const playbookDir = join(skillsDir, "poteto-mode", "playbooks");
  const playbooks = existsSync(playbookDir) ? readdirSync(playbookDir).filter((name) => name.endsWith(".md")).sort() : [];
  const termsIn = (body) => TERMS.filter(({ re }) => re.test(body)).map(({ key }) => key);
  const mapping = `# pstack to T3 Code mapping

Generated by pstack-t3 from pstack ${version}. Do not edit by hand.

Every skill and playbook below runs from \`${outDir}\`. "Adapter rows" lists the Cursor names the file uses, each mapped by \`${ADAPTER}\`. A skill with no rows runs unchanged.

## Skills

${mappingTable([
  ["Skill", "Launcher", "Adapter rows", "Notes"],
  ["---", "---", "---", "---"],
  ...[...classes.keys()].sort().map((skill) => [
    `\`${skill}\``,
    exposed.includes(skill) ? `\`$${PREFIX}${skill}\`` : skill in UNEXPOSED ? `none: ${UNEXPOSED[skill]}` : "read by path",
    [...classes.get(skill).uses].sort().join(", ") || "none",
    NOTES[skill] ?? "",
  ]),
])}

## Playbooks

Routed by \`$${PREFIX}poteto-mode\`, never invoked directly.

${mappingTable([
  ["Playbook", "Adapter rows", "Notes"],
  ["---", "---", "---"],
  ...playbooks.map((name) => {
    const slug = name.replace(/\.md$/, "");
    return [`\`${slug}\``, termsIn(readFileSync(join(playbookDir, name), "utf8")).join(", ") || "none", PLAYBOOK_NOTES[slug] ?? ""];
  }),
])}
`;
  files.set("MAPPING.md", text(mapping));

  const adapterHash = createHash("sha256").update(adapter).digest("hex");
  const source = { generator: "pstack-t3", pstackVersion: version, upstreamCommit: gitHead(root), adapterSha256: adapterHash, launchers: exposed.map((name) => `${PREFIX}${name}`) };
  files.set(MARKER, text(`${JSON.stringify(source, null, 2)}\n`));

  return { problems, files, exposed, wrapped: [...classes.values()].filter(({ wrap }) => wrap).length, skills: skills.length };
}

export function check(files, out) {
  const outDir = resolve(out);
  const onDisk = new Map(existsSync(outDir) ? walk(outDir).map((path) => [relative(outDir, path), file(path)]) : []);
  return [...new Set([...files.keys(), ...onDisk.keys()])].sort().filter((path) => {
    const [want, have] = [files.get(path), onDisk.get(path)];
    return !want || !have || !want.bytes.equals(have.bytes) || want.executable !== have.executable;
  });
}

export function write(files, out) {
  const outDir = resolve(out);
  if (existsSync(outDir) && readdirSync(outDir).length > 0) {
    const marker = join(outDir, MARKER);
    const ours = existsSync(marker) && JSON.parse(readFileSync(marker, "utf8")).generator === "pstack-t3";
    if (!ours) throw new Error(`${outDir} is not empty and was not generated by pstack-t3. Refusing to replace it.`);
  }
  rmSync(outDir, { recursive: true, force: true });
  for (const [path, { bytes, executable }] of files) {
    mkdirSync(dirname(join(outDir, path)), { recursive: true });
    writeFileSync(join(outDir, path), bytes);
    chmodSync(join(outDir, path), executable ? 0o755 : 0o644);
  }
}

function readLink(path) {
  try {
    return lstatSync(path).isSymbolicLink() ? readlinkSync(path) : null;
  } catch {
    return undefined;
  }
}

// Links each launcher into the Codex user skills dir, and the Claude user skills dir through it.
export function link({ out, launchers, agentsSkills, claudeSkills }) {
  const outDir = resolve(out);
  const launcherRoot = join(outDir, "launchers");
  const report = { created: [], kept: [], removed: [], refused: [] };
  const managed = (dir, target) => {
    const absolute = resolve(dir, target);
    return absolute.startsWith(`${launcherRoot}/`) || (absolute.startsWith(`${resolve(agentsSkills)}/${PREFIX}`) && dir !== resolve(agentsSkills));
  };
  const plan = [
    { dir: resolve(agentsSkills), target: (name) => join(launcherRoot, name) },
    { dir: resolve(claudeSkills), target: (name) => relative(resolve(claudeSkills), join(resolve(agentsSkills), name)) },
  ];
  for (const { dir, target } of plan) {
    mkdirSync(dir, { recursive: true });
    for (const name of readdirSync(dir).filter((entry) => entry.startsWith(PREFIX) && !launchers.includes(entry))) {
      const current = readLink(join(dir, name));
      if (current && managed(dir, current)) {
        unlinkSync(join(dir, name));
        report.removed.push(join(dir, name));
      }
    }
    for (const name of launchers) {
      const path = join(dir, name);
      const want = target(name);
      const current = readLink(path);
      if (current === want) report.kept.push(path);
      else if (current === undefined) {
        symlinkSync(want, path);
        report.created.push(path);
      } else if (current && managed(dir, current)) {
        unlinkSync(path);
        symlinkSync(want, path);
        report.created.push(path);
      } else report.refused.push(path);
    }
  }
  return report;
}

function parseArgs(argv) {
  const home = homedir();
  const options = {
    upstream: undefined,
    out: join(home, ".agents", "pstack-t3"),
    models: join(home, ".agents", "pstack-models.md"),
    agentsSkills: join(home, ".agents", "skills"),
    claudeSkills: join(home, ".claude", "skills"),
    check: false,
    link: false,
  };
  const flags = { "--upstream": "upstream", "--out": "out", "--models": "models", "--agents-skills": "agentsSkills", "--claude-skills": "claudeSkills" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--check") options.check = true;
    else if (argv[i] === "--link") options.link = true;
    else if (argv[i] in flags && argv[i + 1]) options[flags[argv[i]]] = argv[++i];
    else throw new Error(`unknown argument ${argv[i]}`);
  }
  if (!options.upstream) throw new Error("--upstream <cursor/plugins checkout or its pstack folder> is required");
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = build(options);
  for (const problem of result.problems) console.log(`FAIL ${problem}`);
  if (result.problems.length > 0) process.exit(1);
  if (options.check) {
    const drifted = check(result.files, options.out);
    for (const path of drifted.slice(0, 20)) console.log(`drift ${path}`);
    if (drifted.length > 0) {
      console.log(`${options.out} is out of date. Rerun without --check.`);
      process.exit(1);
    }
    console.log(`${options.out} is up to date.`);
    return;
  }
  write(result.files, options.out);
  console.log(`${result.skills} skills, ${result.wrapped} with the adapter line, ${result.exposed.length} launchers, written to ${resolve(options.out)}`);
  if (options.link) {
    const report = link({ ...options, launchers: result.exposed.map((name) => `${PREFIX}${name}`) });
    console.log(`links: ${report.created.length} created, ${report.kept.length} kept, ${report.removed.length} removed`);
    for (const path of report.refused) console.log(`REFUSED ${path} exists and is not a pstack-t3 link`);
    if (report.refused.length > 0) process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exit(1);
  }
}
