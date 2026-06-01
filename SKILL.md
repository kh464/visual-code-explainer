---
name: visual-code-explainer
description: "Generate a stable, interactive visual code-explainer dashboard for a project using the bundled SaaS-style frontend template and project-specific generated data. Use when the user asks to understand a project, visualize implemented features, create a project explanation page, map features to files/components/APIs/services, show module relationships or data flow, or build a demo webpage that explains the current codebase. Do not use for a brief line-by-line explanation when no page or visual artifact is requested."
---

# Visual Code Explainer

Create a human-facing visual explanation dashboard that helps users quickly understand what the current project does, which files implement each feature, how modules collaborate, and how important user flows execute.

The output must feel like a polished AI project-management SaaS dashboard, not a document page or a static screenshot.

## Workflow

1. Load `scan-policy.yaml` and follow the scan strategy before generating page data.
2. Scan the project structure and identify frontend framework, backend framework, route files, API files, components, state management, models, database access, tests, and docs.
3. Summarize real feature modules from filenames, routes, components, APIs, services, tests, and recent code changes.
4. Map each feature to concrete files and, when discoverable, to core functions, classes, components, routes, API endpoints, class inheritance, and interface implementation relationships.
5. Infer module relationships only from evidence in code. Mark uncertain relationships as `inferred relationship`.
6. Copy the bundled frontend template from `assets/code-explainer-template/` into the target output location before writing project content.
7. Generate or update only `template-data.js` for routine runs. Keep `index.html`, `styles.css`, and `app.js` stable unless the user explicitly asks to redesign the template or the target framework requires a port.
8. Validate generated data with `node scripts/validate-template-data.js <output>/template-data.js`. Use `--allow-demo` only when validating the bundled sample data inside this skill.
9. Verify that the generated page is an interactive UI: sidebar navigation switches views without page scrolling, statistic cards open their target views, feature cards update the stacked module drilldown/UML panel below, UML zoom/reset/fullscreen controls respond, UML can be panned in all directions by holding the left mouse button and dragging, the feature demo button opens the matching demo, the module graph renders, runtime timeline renders, demo controls switch steps, autoplay works, test modules can be clicked to show test cases, and code-directory search filters rows.
10. Tell the user where the page was created, how to open it, what it includes, and which relationships are confirmed versus inferred.

## Output Location

Choose the smallest integration that fits the project:

- Prefer the bundled static template for stability, even inside projects that have a frontend stack, unless the user asks for deep framework integration.
- Use the existing frontend stack when the project already has React, Vue, Next.js, Vite, or a similar app structure and integration is clearly more useful than a docs page.
- Prefer `docs/code-explainer/` when the project has a docs area or no obvious frontend route.
- Create a directly openable static page when the project has no frontend environment.

Default static output copied from `assets/code-explainer-template/`:

```text
docs/code-explainer/index.html
docs/code-explainer/styles.css
docs/code-explainer/app.js
docs/code-explainer/template-data.js
```

## Page Content

Include these modules unless the project context makes one impossible:

- Dark left sidebar with product identity, click-to-switch navigation, project information, and a regenerate button.
- Compact main area that starts directly with clickable project statistic cards; do not include a top AI welcome card because it wastes vertical space.
- Clickable project statistic cards for feature modules, core files, module relationships, runtime flows, and tests or coverage. Each statistic must provide a `target` view such as `features`, `directory`, `architecture`, `runtime`, or `tests`.
- Implemented feature cards with icons, short descriptions, status labels, and a click-driven module drilldown panel showing a zoomable, fullscreen-capable SVG UML class diagram: class nodes, attributes, methods, standalone functions, call/data edges, and class inheritance/implementation edges.
- Module relationship diagram showing frontend, API gateway, business modules, and persistence/data nodes.
- Runtime timeline from user request through frontend, API, business logic, database, response, and rendering.
- Interactive demo area with feature menu, step cards, previous/next controls, autoplay, and mock UI panels.
- Code directory table listing high-value files, responsibilities, related features, and reading reasons.
- Tests view with the coverage summary aligned beside clickable test modules, plus a wide full-row detail panel showing test files, run commands, and extracted test cases.

## Evidence Rules

- Do not invent features, files, routes, APIs, components, or services.
- Prefer evidence from real source files, tests, route definitions, API handlers, schemas, and project docs.
- Label mock data clearly as demo data.
- Label uncertain call paths, dependencies, or data flow as `inferred relationship`.
- Keep explanations short and visual. Use cards, diagrams, timelines, and interactive demos more than paragraphs.
- Explain what each module is responsible for and how it collaborates with the rest of the system.
- For class diagrams, extract inheritance from `extends`, `implements`, base classes, interfaces, mixins, model inheritance, or framework-specific equivalents when there is code evidence. Do not invent inheritance edges.

## Frontend Template Contract

Use the bundled template as the default page framework. Do not generate a one-off static mockup or screenshot-like page.

Template assets:

```text
assets/code-explainer-template/index.html
assets/code-explainer-template/styles.css
assets/code-explainer-template/app.js
assets/code-explainer-template/template-data.js
assets/reference/frontend-page-sample.png
scripts/validate-template-data.js
```

Rules:

- Use the current SaaS Dashboard layout: 220px dark sidebar, light main area, five clickable stat cards at the top, click-switched view stack with internally scrollable views, stacked feature grid above the module drilldown/UML panel, module graph, runtime timeline, interactive demo, code directory, and tests view. Do not include the old top AI welcome card.
- Copy `index.html`, `styles.css`, and `app.js` unchanged for normal project runs.
- Regenerate `template-data.js` from project analysis. Treat it as the main project-specific artifact.
- Use Simplified Chinese for all human-facing template UI text and generated `template-data.js` content by default, unless the user explicitly requests another language.
- Preserve object keys, file paths, ids, and machine-readable values such as `call`, `data`, `confirmed`, or `inferred` when they are needed by the template logic.
- Preserve the data contract used by `template-data.js`: `navigation`, `project`, `stats`, `features`, `graph.nodes`, `graph.edges`, `runtimeSteps`, `demos`, `codeDirectory`, and `tests`. Each `features[]` item should include `id`, `name`, `summary`, optional `detail`, `entryPoints`, `files`, `classes`, `functions`, and `relations` when discoverable. Use `classes[].name`, `classes[].type`, optional `classes[].properties`, `classes[].methods`, `classes[].extends`, `classes[].implements`, and `relations[].from`, `relations[].to`, `relations[].label`, `relations[].type` (`call`, `data`, `inheritance`, or `implements`). Each `tests.items[]` item should include `type`, `name`, `detail`, `status`, optional `file`, optional `command`, and `cases[]`; each `cases[]` item should include `name`, `scenario` or `detail`, `assertion`, and `status` when discoverable.
- Keep the page interactive. The output must support sidebar view switching, statistic-card view switching, feature-card selection that stays on the feature page and updates the SVG UML class diagram below the feature grid, UML zoom in/out/reset, left-mouse drag panning in all directions, draggable UML nodes with connected edges and edge labels updating live, and fullscreen toggles, a separate `打开演示` button for matching demos, SVG graph rendering, runtime timeline, demo menu, demo step switching, autoplay, fullscreen toggles, clickable tests view with test-case details, and code-directory search. The desktop app should use click-to-switch pages instead of one long document, but each active page/view must allow internal vertical scrolling so hidden or future expanded content remains reachable.
- Preserve text readability when generated content is long. Cards, relation details, directory rows, test cases, mock demo fields, graph nodes, and UML nodes must wrap, grow, scroll, or show an explicit `+ N more` marker instead of clipping text outside its container.
- If porting to React, Vue, Next.js, or another frontend stack, keep the same information architecture and interactions from the static template instead of inventing a new layout.
- Do not inline the entire project explanation as fixed HTML blocks when the same content belongs in generated data.
- Do not replace the interactive UI with a canvas screenshot, a flat image, or absolutely positioned decorative elements that cannot be inspected or interacted with.

## Template Data Guardrails

- Replace all bundled demo placeholders in real project runs. Do not leave sample project names, sample users, sample task files, or fake test files unless they actually exist in the target project.
- Adapt feature labels to the project type. For backend-only, CLI, SDK, library, data pipeline, or infrastructure projects, treat APIs, commands, packages, jobs, providers, schemas, or deployment units as feature modules instead of forcing a frontend/user-management story.
- Prefer `待分析`, `未发现`, or empty arrays over invented evidence. If no tests, coverage, demos, inheritance, or database layer are found, show that clearly instead of fabricating coverage or relationships.
- Keep `template-data.js` project-specific and evidence-backed. Use mock demo panels only to illustrate an already-confirmed feature, and label them as demo data when they are not directly executable.
- Run `node scripts/validate-template-data.js <output>/template-data.js` before finishing. The validator should fail real project output that still contains bundled demo placeholders or broken data relationships.

## Scan Strategy

- On the first run, perform a full project scan, build the project index, code relationship graph, and the visual frontend page.
- On later runs, prefer incremental updates. Read the existing state from `.codex/visual-code-explainer/`, detect changed files with git status, git diff, file hashes, or modification times, and re-analyze only changed files plus directly affected dependencies.
- Patch the generated data instead of rebuilding the frontend shell unless a full scan or explicit redesign is required.
- Load scan cadence and hard full-scan rules from `scan-policy.yaml` in this skill directory.
- Treat `scan_policy.full_scan_every_change_batches` as a hard rule. After that many incremental change batches have been processed, force a full project scan, rebuild the index and graph, refresh the visual frontend data, and reset the change-batch counter.
- Store the processed incremental change-batch counter in `.codex/visual-code-explainer/scan-state.yaml` inside the target project.
- Force a full project scan when state or index files are missing or corrupt, major project structure changes are detected, framework or build configuration changes, extensive file moves or renames occur, or the user explicitly requests a full scan.

## Final Response

After generating the page, respond concisely with:

```text
已生成代码理解演示页面。
页面位置：xxx
打开方式：xxx

页面包含：
- 项目总览与统计卡片
- 已实现功能卡片与 SVG UML 类图
- 模块关系图
- 运行流程时间线
- 功能交互演示区
- 代码目录
- 测试覆盖与用例详情

说明：
- 页面基于当前代码结构自动分析生成。
- 无法从代码中完全确认的关系已标注为 inferred relationship。
- 页面使用 skill 内置 Dashboard 模板生成，后续项目更新优先只刷新 template-data.js。
```
