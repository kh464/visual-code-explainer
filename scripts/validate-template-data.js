#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const args = process.argv.slice(2);
const allowDemo = args.includes("--allow-demo");
const target = args.find((arg) => arg !== "--allow-demo");

if (!target) {
  console.error("Usage: node scripts/validate-template-data.js <template-data.js> [--allow-demo]");
  process.exit(2);
}

const filePath = path.resolve(target);
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function checkText(value, field) {
  if (!hasText(value)) fail(`${field} must be a non-empty string`);
}

function loadData() {
  if (!fs.existsSync(filePath)) fail(`File not found: ${filePath}`);
  if (errors.length) return null;

  const code = fs.readFileSync(filePath, "utf8");
  const context = { window: {} };
  vm.createContext(context);
  try {
    vm.runInContext(code, context, { filename: filePath, timeout: 1000 });
  } catch (error) {
    fail(`template-data.js failed to execute: ${error.message}`);
    return null;
  }

  const data = context.window.CODE_EXPLAINER_DATA;
  if (!isObject(data)) fail("window.CODE_EXPLAINER_DATA must be an object");
  return data || null;
}

function validateTopLevel(data) {
  ["navigation", "stats", "features", "runtimeSteps", "demos", "codeDirectory"].forEach((key) => {
    if (!Array.isArray(data[key])) fail(`${key} must be an array`);
  });
  if (!isObject(data.project)) fail("project must be an object");
  if (!isObject(data.graph)) fail("graph must be an object");
  if (!isObject(data.tests)) fail("tests must be an object");
  if (isObject(data.graph)) {
    if (!Array.isArray(data.graph.nodes)) fail("graph.nodes must be an array");
    if (!Array.isArray(data.graph.edges)) fail("graph.edges must be an array");
  }
}

function validateNavigation(data) {
  const ids = new Set(asArray(data.navigation).map((item) => item && item.id).filter(Boolean));
  const knownViews = new Set(["overview", "features", "architecture", "runtime", "demo", "directory", "tests"]);
  asArray(data.navigation).forEach((item, index) => {
    if (!isObject(item)) return fail(`navigation[${index}] must be an object`);
    checkText(item.id, `navigation[${index}].id`);
    checkText(item.label, `navigation[${index}].label`);
  });
  asArray(data.stats).forEach((stat, index) => {
    if (!isObject(stat)) return fail(`stats[${index}] must be an object`);
    checkText(stat.label, `stats[${index}].label`);
    if (stat.value == null || String(stat.value).trim() === "") fail(`stats[${index}].value is required`);
    if (stat.target && !ids.has(stat.target) && !knownViews.has(stat.target)) {
      fail(`stats[${index}].target "${stat.target}" does not match a navigation view`);
    }
  });
}

function validateFeatures(data) {
  const featureIds = new Set();
  asArray(data.features).forEach((feature, index) => {
    if (!isObject(feature)) return fail(`features[${index}] must be an object`);
    checkText(feature.id, `features[${index}].id`);
    checkText(feature.name, `features[${index}].name`);
    checkText(feature.summary, `features[${index}].summary`);
    if (feature.id) featureIds.add(feature.id);

    if (!Array.isArray(feature.entryPoints) || !feature.entryPoints.length) {
      warn(`features[${index}] has no entryPoints; use "待分析" only when code evidence is missing`);
    }
    ["files", "classes", "functions", "relations"].forEach((key) => {
      if (feature[key] != null && !Array.isArray(feature[key])) fail(`features[${index}].${key} must be an array when present`);
    });

    asArray(feature.classes).forEach((klass, classIndex) => {
      if (!isObject(klass)) return fail(`features[${index}].classes[${classIndex}] must be an object`);
      checkText(klass.name, `features[${index}].classes[${classIndex}].name`);
      if (klass.extends != null && !hasText(klass.extends)) fail(`features[${index}].classes[${classIndex}].extends must be a string`);
      if (klass.implements != null && !Array.isArray(klass.implements)) fail(`features[${index}].classes[${classIndex}].implements must be an array`);
    });

    asArray(feature.relations).forEach((relation, relationIndex) => {
      if (!isObject(relation)) return fail(`features[${index}].relations[${relationIndex}] must be an object`);
      checkText(relation.from, `features[${index}].relations[${relationIndex}].from`);
      checkText(relation.to, `features[${index}].relations[${relationIndex}].to`);
      if (relation.type && !["call", "data", "inheritance", "implements", "inferred"].includes(relation.type)) {
        warn(`features[${index}].relations[${relationIndex}].type "${relation.type}" is not a standard relation type`);
      }
    });
  });

  asArray(data.demos).forEach((demo, index) => {
    if (!isObject(demo)) return fail(`demos[${index}] must be an object`);
    checkText(demo.name, `demos[${index}].name`);
    if (demo.featureId && !featureIds.has(demo.featureId)) warn(`demos[${index}].featureId "${demo.featureId}" has no matching feature`);
    if (!Array.isArray(demo.steps)) warn(`demos[${index}].steps should be an array`);
  });
}

function validateGraph(data) {
  const nodeIds = new Set(asArray(data.graph && data.graph.nodes).map((node) => node && node.id).filter(Boolean));
  asArray(data.graph && data.graph.nodes).forEach((node, index) => {
    if (!isObject(node)) return fail(`graph.nodes[${index}] must be an object`);
    checkText(node.id, `graph.nodes[${index}].id`);
    checkText(node.label, `graph.nodes[${index}].label`);
  });
  asArray(data.graph && data.graph.edges).forEach((edge, index) => {
    if (!isObject(edge)) return fail(`graph.edges[${index}] must be an object`);
    checkText(edge.from, `graph.edges[${index}].from`);
    checkText(edge.to, `graph.edges[${index}].to`);
    if (edge.from && !nodeIds.has(edge.from)) fail(`graph.edges[${index}].from "${edge.from}" does not exist in graph.nodes`);
    if (edge.to && !nodeIds.has(edge.to)) fail(`graph.edges[${index}].to "${edge.to}" does not exist in graph.nodes`);
  });
}

function validateTests(data) {
  const tests = data.tests || {};
  if (tests.coverage == null) warn("tests.coverage is missing; use \"暂无\" when coverage cannot be found");
  if (!Array.isArray(tests.items)) fail("tests.items must be an array");
  asArray(tests.items).forEach((item, index) => {
    if (!isObject(item)) return fail(`tests.items[${index}] must be an object`);
    checkText(item.name, `tests.items[${index}].name`);
    if (item.cases != null && !Array.isArray(item.cases)) fail(`tests.items[${index}].cases must be an array when present`);
    asArray(item.cases).forEach((testCase, caseIndex) => {
      if (!isObject(testCase)) return fail(`tests.items[${index}].cases[${caseIndex}] must be an object`);
      checkText(testCase.name, `tests.items[${index}].cases[${caseIndex}].name`);
      if (!hasText(testCase.scenario) && !hasText(testCase.detail)) warn(`tests.items[${index}].cases[${caseIndex}] has no scenario/detail`);
      if (!hasText(testCase.assertion)) warn(`tests.items[${index}].cases[${caseIndex}] has no assertion`);
    });
  });
}

function validateDemoPlaceholders(data) {
  if (allowDemo) return;
  const text = JSON.stringify(data);
  const placeholders = [
    "CodeX 项目演示",
    "这个演示面板",
    "src/pages/UserPage.tsx",
    "src/services/userService.ts",
    "src/pages/TaskBoard.tsx",
    "tests/userService.test.ts",
    "alice@example.com",
    "用户管理演示"
  ];
  const hits = placeholders.filter((placeholder) => text.includes(placeholder));
  if (hits.includes("CodeX 项目演示") || hits.length >= 3) {
    fail(`Demo placeholder content remains in generated data: ${hits.join(", ")}`);
  }
}

const data = loadData();
if (data) {
  validateTopLevel(data);
  validateNavigation(data);
  validateFeatures(data);
  validateGraph(data);
  validateTests(data);
  validateDemoPlaceholders(data);
}

warnings.forEach((message) => console.warn(`Warning: ${message}`));
if (errors.length) {
  errors.forEach((message) => console.error(`Error: ${message}`));
  process.exit(1);
}
console.log(`template-data validation passed: ${filePath}`);