#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function rel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function note(message) {
  console.log(`ok  ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`warn ${message}`);
}

function fail(message) {
  errors.push(message);
  console.error(`err ${message}`);
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    fail(`missing required file: ${relativePath}`);
    return false;
  }
  note(`found ${relativePath}`);
  return true;
}

function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();

  if (options.expectFailure) {
    if (result.status === 0) {
      fail(`${label} unexpectedly passed`);
    } else {
      note(`${label} failed as expected`);
    }
    return result;
  }

  if (result.status !== 0) {
    fail(`${label} failed${output ? `\n${output}` : ""}`);
  } else {
    note(label);
  }
  return result;
}

function checkRequiredFiles() {
  [
    "SKILL.md",
    "README.md",
    "LICENSE",
    "scan-policy.yaml",
    "package.json",
    "agents/openai.yaml",
    "assets/code-explainer-template/index.html",
    "assets/code-explainer-template/styles.css",
    "assets/code-explainer-template/app.js",
    "assets/code-explainer-template/template-data.js",
    "assets/reference/frontend-page-sample.png",
    "scripts/validate-template-data.js",
    "scripts/check-skill.js"
  ].forEach(requireFile);
}

function checkNoStaleFiles() {
  [
    "frontend-page-sample.png",
    "前端页面样例.png",
    "assets/code-explainer-template/encoding-probe.txt"
  ].forEach((relativePath) => {
    if (exists(relativePath)) {
      fail(`stale file should not be present: ${relativePath}`);
    }
  });
}

function checkSkillMetadata() {
  if (!exists("SKILL.md")) return;
  const skill = read("SKILL.md");
  const match = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    fail("SKILL.md must start with YAML frontmatter");
    return;
  }
  const frontmatter = match[1];
  if (!/^name:\s*visual-code-explainer\s*$/m.test(frontmatter)) {
    fail("SKILL.md frontmatter must include name: visual-code-explainer");
  }
  if (!/^description:\s*.+/m.test(frontmatter)) {
    fail("SKILL.md frontmatter must include a non-empty description");
  }
  if (!skill.includes("scripts/validate-template-data.js")) {
    fail("SKILL.md should mention the template-data validator");
  }
  note("SKILL.md metadata looks usable");
}

function checkAgentMetadata() {
  if (!exists("agents/openai.yaml")) return;
  const yaml = read("agents/openai.yaml");
  ["display_name", "short_description", "default_prompt"].forEach((key) => {
    if (!yaml.includes(`${key}:`)) fail(`agents/openai.yaml missing ${key}`);
  });
  note("agents/openai.yaml has required UI fields");
}

function checkPackageJson() {
  if (!exists("package.json")) return;
  let pkg;
  try {
    pkg = JSON.parse(read("package.json"));
  } catch (error) {
    fail(`package.json is invalid JSON: ${error.message}`);
    return;
  }
  if (!pkg.scripts || pkg.scripts.validate !== "node scripts/check-skill.js") {
    fail("package.json must expose npm run validate");
  }
  if (pkg.license !== "Apache-2.0") fail("package.json license should be Apache-2.0");
  note("package.json exposes validation script");
}

function checkReadme() {
  if (!exists("README.md")) return;
  const readme = read("README.md");
  [
    "visual-code-explainer",
    "SKILL.md",
    "npm run validate",
    "scan-policy.yaml",
    "Apache License 2.0"
  ].forEach((snippet) => {
    if (!readme.includes(snippet)) fail(`README.md should mention ${snippet}`);
  });
  note("README.md includes install, validation, scan policy, and license notes");
}

function checkLicense() {
  if (!exists("LICENSE")) return;
  const license = read("LICENSE");
  if (!license.includes("Apache License") || !license.includes("Version 2.0")) {
    fail("LICENSE should contain Apache License 2.0 text");
  }
  note("LICENSE is Apache-2.0");
}

function checkJavaScriptSyntax() {
  [
    "assets/code-explainer-template/app.js",
    "assets/code-explainer-template/template-data.js",
    "scripts/validate-template-data.js",
    "scripts/check-skill.js"
  ].forEach((relativePath) => {
    if (exists(relativePath)) run(`node --check ${relativePath}`, process.execPath, ["--check", relativePath]);
  });
}

function checkTemplateData() {
  if (!exists("scripts/validate-template-data.js") || !exists("assets/code-explainer-template/template-data.js")) return;
  run(
    "demo template-data validates with --allow-demo",
    process.execPath,
    ["scripts/validate-template-data.js", "assets/code-explainer-template/template-data.js", "--allow-demo"]
  );
  run(
    "demo placeholder guard",
    process.execPath,
    ["scripts/validate-template-data.js", "assets/code-explainer-template/template-data.js"],
    { expectFailure: true }
  );
}

function checkOptionalCodexValidator() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), ".codex");
  const validator = path.join(codexHome, "skills", ".system", "skill-creator", "scripts", "quick_validate.py");
  if (!fs.existsSync(validator)) {
    warn(`optional Codex quick_validate.py not found at ${rel(validator)}`);
    return;
  }
  const python = process.env.PYTHON || "python";
  const result = run("Codex quick_validate.py", python, ["-X", "utf8", validator, root]);
  if (result.error) warn(`could not run optional Codex validator: ${result.error.message}`);
}

checkRequiredFiles();
checkNoStaleFiles();
checkSkillMetadata();
checkAgentMetadata();
checkPackageJson();
checkReadme();
checkLicense();
checkJavaScriptSyntax();
checkTemplateData();
checkOptionalCodexValidator();

if (warnings.length) console.warn(`\n${warnings.length} warning(s)`);
if (errors.length) {
  console.error(`\n${errors.length} validation error(s)`);
  process.exit(1);
}
console.log("\nSkill validation passed.");
