import assert from "node:assert/strict";
import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { build, check, link, write } from "../scripts/build.mjs";

function put(root, path, body) {
  mkdirSync(join(root, path, ".."), { recursive: true });
  writeFileSync(join(root, path), body);
}

function fixture({ extraTerm = "" } = {}) {
  const root = mkdtempSync(join(tmpdir(), "pstack-t3-up-"));
  put(root, "scripts/generate-pstack-harness-trees.mjs", `const TERMS = [\n  { key: "\`Task\`", re: /x/ },\n  { key: '\`environment: "cloud"\`', re: /y/ },${extraTerm}\n];\n`);
  put(root, "pstack/plugin.json", JSON.stringify({ name: "pstack", version: "9.9.9" }));
  put(root, "pstack/LICENSE", "MIT\n");
  put(root, "pstack/README.md", "# pstack\n\n<details>\n<summary>all skills</summary>\n\n| skill | use |\n|---|---|\n| [`/alpha`](./skills/alpha/SKILL.md) | a |\n| [`/beta`](./skills/beta/SKILL.md) | b |\n| [`/automate-me`](./skills/automate-me/SKILL.md) | c |\n\n</details>\n");
  put(root, "pstack/skills/alpha/SKILL.md", '---\nname: alpha\ndescription: "Use for /alpha."\ndisable-model-invocation: true\n---\n\n# Alpha\n\nSpawn a `Task` and run the **beta** skill. See [guide](../../docs/guide/README.md) and [automations](../../automations/x.md).\n');
  put(root, "pstack/skills/alpha/references/prompt.md", "Prompt.\n");
  put(root, "pstack/skills/beta/SKILL.md", "---\nname: beta\ndescription: Plain skill.\n---\n\n# Beta\n\nNothing Cursor-specific.\n");
  put(root, "pstack/skills/automate-me/SKILL.md", "---\nname: automate-me\ndescription: Automations.\n---\n\n# Automate\n\nPlain.\n");
  put(root, "pstack/skills/make-bot-ui/SKILL.md", "---\nname: make-bot-ui\ndescription: Bot UI.\n---\n\n# Bot UI\n\nPlain.\n");
  put(root, "pstack/skills/poteto-mode/SKILL.md", "---\nname: poteto-mode\ndescription: Router.\ndisable-model-invocation: true\n---\n\n# Poteto mode\n\nUse `run_in_background: true`.\n");
  put(root, "pstack/skills/poteto-mode/playbooks/babysit.md", "### Babysit\n\nRun `scripts/watch-pr/watch-pr` under `/loop`.\n");
  put(root, "pstack/skills/setup-pstack/SKILL.md", "---\nname: setup-pstack\ndescription: Setup.\n---\n\n# Setup\n\nPlain.\n");
  put(root, "pstack/skills/poteto-mode/scripts/run.sh", "#!/bin/sh\n");
  chmodSync(join(root, "pstack/skills/poteto-mode/scripts/run.sh"), 0o755);
  put(root, "pstack/agents/poteto-agent.md", "agent\n");
  put(root, "pstack/docs/guide/README.md", "guide\n");
  put(root, "pstack/automations/x.md", "x\n");
  return root;
}

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "pstack-t3-out-"));
  return { out: join(dir, "out"), models: join(dir, "models.md"), agentsSkills: join(dir, "agents"), claudeSkills: join(dir, "claude"), dir };
}

const body = (result, path) => result.files.get(path).bytes.toString("utf8");

test("wraps only skills that use Cursor names, with the absolute adapter path", () => {
  const paths = scratch();
  const result = build({ upstream: fixture(), ...paths });
  assert.deepEqual(result.problems, []);
  assert.match(body(result, "skills/alpha/SKILL.md"), new RegExp(`# Alpha\\n\\nIn T3 Code, read \\[the T3 Code adapter\\]\\(${resolve(paths.out)}/docs/harness/t3-code.md\\)`));
  assert.doesNotMatch(body(result, "skills/beta/SKILL.md"), /T3 Code adapter/);
});

test("launchers adapt command names and preserve the manual-only flag", () => {
  const paths = scratch();
  const result = build({ upstream: fixture(), ...paths });
  assert.deepEqual(result.exposed, ["alpha", "beta", "poteto-mode", "setup-pstack"]);
  const alpha = body(result, "launchers/pstack-alpha/SKILL.md");
  assert.match(alpha, /^---\nname: pstack-alpha\ndescription: "Use for \$pstack-alpha."\ndisable-model-invocation: true\n---/);
  assert.match(alpha, new RegExp(`Read \`${resolve(paths.out)}/skills/alpha/SKILL.md\``));
  assert.ok(result.files.has("launchers/pstack-alpha/agents/openai.yaml"));
  assert.doesNotMatch(body(result, "launchers/pstack-beta/SKILL.md"), /disable-model-invocation/);
  assert.ok(!result.files.has("launchers/pstack-beta/agents/openai.yaml"));
  assert.ok(!result.files.has("launchers/pstack-automate-me/SKILL.md"), "automate-me stays unexposed");
});

test("adapter placeholders are filled and no generated markdown keeps one", () => {
  const paths = scratch();
  const result = build({ upstream: fixture(), ...paths });
  const adapter = body(result, "docs/harness/t3-code.md");
  assert.ok(adapter.includes(resolve(paths.models)));
  for (const [path, entry] of result.files) if (path.endsWith(".md")) assert.doesNotMatch(entry.bytes.toString("utf8"), /\{\{[A-Z]+\}\}/, path);
});

test("links to files left out of the tree point at GitHub, links inside it stay relative", () => {
  const result = build({ upstream: fixture(), ...scratch() });
  const alpha = body(result, "skills/alpha/SKILL.md");
  assert.ok(alpha.includes("](../../docs/guide/README.md)"));
  assert.ok(alpha.includes("](https://github.com/cursor/plugins/blob/main/pstack/automations/x.md)"));
});

test("mapping lists every skill and playbook with the adapter rows it needs", () => {
  const result = build({ upstream: fixture(), ...scratch() });
  const mapping = body(result, "MAPPING.md");
  assert.match(mapping, /\| `alpha` \| `\$pstack-alpha` \| Run another pstack skill, `Task` \|/);
  assert.match(mapping, /\| `automate-me` \| none: /);
  assert.match(mapping, /\| `babysit` \| Cursor's `\/loop`, `scripts\/watch-pr\/watch-pr` \|/);
});

test("fails when upstream adds an adapter term this generator does not know", () => {
  const result = build({ upstream: fixture({ extraTerm: '\n  { key: "brand-new", re: /z/ },' }), ...scratch() });
  assert.deepEqual(result.problems, ['upstream adapter term "brand-new" is not in UPSTREAM_TERMS']);
});

test("check reports drift after a hand edit and write keeps executable bits", () => {
  const paths = scratch();
  const result = build({ upstream: fixture(), ...paths });
  write(result.files, paths.out);
  assert.deepEqual(check(result.files, paths.out), []);
  assert.ok(lstatSync(join(paths.out, "skills/poteto-mode/scripts/run.sh")).mode & 0o100);
  writeFileSync(join(paths.out, "skills/beta/SKILL.md"), "edited\n");
  assert.deepEqual(check(result.files, paths.out), ["skills/beta/SKILL.md"]);
});

test("write refuses to replace a folder it did not generate", () => {
  const paths = scratch();
  put(paths.out, "precious.txt", "keep\n");
  assert.throws(() => write(build({ upstream: fixture(), ...paths }).files, paths.out), /Refusing to replace/);
  assert.equal(readFileSync(join(paths.out, "precious.txt"), "utf8"), "keep\n");
});

test("link is idempotent, prunes stale launchers, and never touches foreign entries", () => {
  const paths = scratch();
  write(build({ upstream: fixture(), ...paths }).files, paths.out);
  mkdirSync(join(paths.claudeSkills, "pstack-beta"), { recursive: true });
  const first = link({ ...paths, launchers: ["pstack-alpha", "pstack-beta"] });
  assert.equal(first.created.length, 3);
  assert.deepEqual(first.refused, [join(paths.claudeSkills, "pstack-beta")]);
  assert.equal(readlinkSync(join(paths.claudeSkills, "pstack-alpha")), "../agents/pstack-alpha");
  assert.ok(existsSync(join(paths.claudeSkills, "pstack-alpha", "SKILL.md")), "claude link resolves through the agents link");

  const second = link({ ...paths, launchers: ["pstack-alpha"] });
  assert.deepEqual(second.created, []);
  assert.deepEqual(second.removed, [join(paths.agentsSkills, "pstack-beta")]);
  assert.ok(existsSync(join(paths.claudeSkills, "pstack-beta")), "a real folder is never removed");

  symlinkSync("/elsewhere", join(paths.agentsSkills, "pstack-other"));
  link({ ...paths, launchers: ["pstack-alpha"] });
  assert.equal(readlinkSync(join(paths.agentsSkills, "pstack-other")), "/elsewhere", "a foreign link is never removed");
});

test("real upstream builds with no problems", { skip: !process.env.PSTACK_UPSTREAM && "set PSTACK_UPSTREAM to a cursor/plugins checkout" }, () => {
  const result = build({ upstream: process.env.PSTACK_UPSTREAM, ...scratch() });
  assert.deepEqual(result.problems, []);
  assert.ok(result.exposed.includes("poteto-mode"));
});

test("T3 setup and help use the requested model path without Cursor installation instructions", () => {
  const paths = scratch();
  const upstream = fixture();
  put(upstream, "pstack/skills/poteto-help/SKILL.md", "---\nname: poteto-help\ndescription: Help.\ndisable-model-invocation: true\n---\n\n# Help\n\nInstall with /add-plugin pstack.\n");
  const result = build({ upstream, ...paths });
  const setup = body(result, "skills/setup-pstack/SKILL.md");
  const help = body(result, "skills/poteto-help/SKILL.md");
  assert.ok(setup.includes(resolve(paths.models)));
  assert.ok(help.includes(resolve(paths.models)));
  assert.doesNotMatch(setup + help, /\.cursor\/rules|add-plugin|Custom Mode|alwaysApply/);
  assert.ok(setup.includes("documentation"));
  assert.ok(setup.includes("review of GPT work"));
});

test("operational model instructions no longer offer unavailable Cursor slugs or fallback substitutions", () => {
  const upstream = fixture();
  put(upstream, "pstack/skills/how/SKILL.md", '---\nname: how\ndescription: How.\n---\n\n# How\n\nEvery spawn is a Task subagent with `subagent_type: generalPurpose`. Explorers use `grok-4.7-xhigh-fast`.\n');
  put(upstream, "pstack/skills/poteto-mode/playbooks/feature.md", 'Delegate using your configured feature model (default `grok-4.7-xhigh-fast`).\n');
  put(upstream, "pstack/skills/poteto-mode/SKILL.md", '---\nname: poteto-mode\ndescription: Router.\n---\n\n# Poteto mode\n\n## Subagents\n\nUse `run_in_background: true` and raise effort up to max.\n\n## Writing the reply\n\nKeep the evidence.\n');
  const result = build({ upstream, ...scratch() });
  assert.doesNotMatch(body(result, "skills/how/SKILL.md"), /grok-4\.7|Task subagent/);
  assert.doesNotMatch(body(result, "skills/poteto-mode/playbooks/feature.md"), /grok-4\.7/);
  assert.doesNotMatch(body(result, "skills/poteto-mode/SKILL.md"), /run_in_background: true|up to max/);
  assert.ok(body(result, "skills/poteto-mode/SKILL.md").includes("Keep the evidence."));
});

test("pstack 0.15.48 wording routes through the T3 Model policy and any Cursor slug is replaced", () => {
  const upstream = fixture();
  put(upstream, "pstack/skills/how/SKILL.md", '---\nname: how\ndescription: How.\n---\n\n# How\n\nSpawn one Task subagent with `subagent_type: generalPurpose` and `readonly: true` that explores and explains in one pass. Give it the user\'s question and this brief:\n\n> Explain it.\n');
  put(upstream, "pstack/skills/arena/SKILL.md", '---\nname: arena\ndescription: Arena.\n---\n\n# Arena\n\n3. Pick the runners from the `arena runners` line, by default `gemini-4-neon-xhigh`. If the Task tool rejects a slug, use the nearest valid slug.\n');
  put(upstream, "pstack/skills/poteto-mode/playbooks/bug-fix.md", 'Delegate using your configured bug-fix model (default `claude-opus-5-5-xhigh-fast`).\n');
  const result = build({ upstream, ...scratch() });
  assert.deepEqual(result.problems, []);
  const how = body(result, "skills/how/SKILL.md");
  assert.match(how, /T3 Model policy[\s\S]*`how explainer`/);
  assert.doesNotMatch(how, /Task subagent/);
  assert.ok(how.includes("> Explain it."));
  const arena = body(result, "skills/arena/SKILL.md");
  assert.match(arena, /T3 Model policy/);
  assert.doesNotMatch(arena, /gemini-4|nearest valid slug/);
  assert.ok(body(result, "skills/poteto-mode/playbooks/bug-fix.md").includes("(fallback per T3 Model policy)"));
});

test("fails when a skill still starts agents without the T3 Model policy", () => {
  const upstream = fixture();
  put(upstream, "pstack/skills/how/SKILL.md", '---\nname: how\ndescription: How.\n---\n\n# How\n\nLaunch a helper subagent in some new wording.\n');
  const result = build({ upstream, ...scratch() });
  assert.ok(result.problems.some((problem) => problem.includes("skills/how/SKILL.md starts agents without the T3 Model policy")));
});
