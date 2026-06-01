(function () {
  "use strict";

  const source = window.CODE_EXPLAINER_DATA || {};
  const state = {
    activeView: "overview",
    selectedFeature: null,
    selectedDemo: 0,
    selectedDemoStep: 0,
    selectedTest: 0,
    autoplayTimer: null,
    directoryQuery: "",
    umlScale: 1,
    umlPanning: false,
    umlPanPointerId: null,
    umlPanStartX: 0,
    umlPanStartY: 0,
    umlPanScrollLeft: 0,
    umlPanScrollTop: 0,
    umlNodeDragging: false,
    umlNodePointerId: null,
    umlNodeStartX: 0,
    umlNodeStartY: 0,
    umlNodeOriginX: 0,
    umlNodeOriginY: 0
  };

  const fallbackNav = [
    { id: "overview", label: "项目总览", icon: "总" },
    { id: "features", label: "功能模块", icon: "能" },
    { id: "architecture", label: "模块关系", icon: "联" },
    { id: "runtime", label: "运行流程", icon: "流" },
    { id: "demo", label: "演示体验", icon: "演" },
    { id: "directory", label: "代码目录", icon: "文" },
    { id: "tests", label: "测试覆盖", icon: "测" }
  ];

  const data = normalizeData(source);

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function normalizeData(input) {
    const project = input.project || {};
    return {
      navigation: Array.isArray(input.navigation) && input.navigation.length ? input.navigation : fallbackNav,
      project: {
        name: project.name || "项目名称",
        version: project.version || "v1.0.0",
        updatedAt: project.updatedAt || "-",
        generatedAt: project.generatedAt || new Date().toISOString().slice(0, 10),
        generator: project.generator || "CodeX",
        summary: project.summary || "当前项目的功能、模块关系、运行流程和关键代码入口已整理为可交互演示面板。",
        points: Array.isArray(project.points) ? project.points : [],
        quickActions: Array.isArray(project.quickActions) ? project.quickActions : []
      },
      stats: Array.isArray(input.stats) ? input.stats : [],
      features: Array.isArray(input.features) ? input.features : [],
      graph: input.graph || { nodes: [], edges: [] },
      runtimeSteps: Array.isArray(input.runtimeSteps) ? input.runtimeSteps : [],
      demos: Array.isArray(input.demos) ? input.demos : [],
      codeDirectory: Array.isArray(input.codeDirectory) ? input.codeDirectory : [],
      tests: input.tests || { coverage: "-", summary: "暂无测试信息", items: [] }
    };
  }

  function init() {
    renderNavigation();
    renderProjectInfo();
    renderOverview();
    renderStats();
    renderFeatures();
    renderGraph();
    renderRuntime();
    renderDemos();
    renderDirectory();
    renderTests();
    bindGlobalEvents();
    switchView("overview");
  }

  function bindGlobalEvents() {

    $("#regenButton").addEventListener("click", function () {
      showToast("已记录重新生成请求，请在 Codex 中执行生成流程。");
    });
    $("#viewAllFeatures").addEventListener("click", function () {
      showToast("当前页面已展示全部功能模块。");
    });
    $("#openFeatureDemo").addEventListener("click", openSelectedFeatureDemo);
    $("#umlZoomOut").addEventListener("click", function () { setUmlScale(state.umlScale - 0.2); });
    $("#umlZoomIn").addEventListener("click", function () { setUmlScale(state.umlScale + 0.2); });
    $("#umlZoomReset").addEventListener("click", function () { setUmlScale(1); });
    $("#umlFullscreen").addEventListener("click", function () { toggleUmlFullscreen(); });
    bindUmlPanEvents();
    $("#graphFullscreen").addEventListener("click", function () {
      $("#architecturePanel").classList.toggle("is-fullscreen");
      this.textContent = $("#architecturePanel").classList.contains("is-fullscreen") ? "退出全屏" : "全屏查看";
    });
    $("#demoFullscreen").addEventListener("click", function () {
      $("#demoStage").classList.toggle("is-fullscreen");
    });
    $("#prevStep").addEventListener("click", function () { moveDemoStep(-1); });
    $("#nextStep").addEventListener("click", function () { moveDemoStep(1); });
    $("#autoplayToggle").addEventListener("change", toggleAutoplay);
    $("#directorySearch").addEventListener("input", function (event) {
      state.directoryQuery = event.target.value.trim().toLowerCase();
      renderDirectory();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && $("#featureUmlShell").classList.contains("is-fullscreen")) toggleUmlFullscreen(false);
    });
  }

  function renderNavigation() {
    const nav = $("#navList");
    nav.innerHTML = data.navigation.map(function (item) {
      return `
        <button class="nav-item" type="button" data-target="${escapeHtml(item.id)}">
          <span class="nav-icon" aria-hidden="true">${escapeHtml(item.icon || "-")}</span>
          <span>${escapeHtml(item.label || item.id)}</span>
        </button>
      `;
    }).join("");

    $$(".nav-item", nav).forEach(function (button) {
      button.addEventListener("click", function () { switchView(button.dataset.target); });
    });
  }

  function switchView(view) {
    state.activeView = view;
    $$(".page-view").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.dataset.view === view);
    });
    $$(".nav-item").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.target === view);
    });
    $$(".stat-card").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.target === view);
    });
    if (view === "features") window.requestAnimationFrame(renderFeatureDetail);
  }

  function renderProjectInfo() {
    const rows = [
      ["项目", data.project.name],
      ["版本", data.project.version],
      ["更新", data.project.updatedAt],
      ["生成", data.project.generatedAt],
      ["生成者", data.project.generator]
    ];
    $("#projectInfoList").innerHTML = rows.map(function (row) {
      return `<div class="info-row"><dt>${escapeHtml(row[0])}</dt><dd>${escapeHtml(row[1])}</dd></div>`;
    }).join("");
  }


  function renderOverview() {
    $("#overviewSummary").textContent = data.project.summary;
    $("#overviewPoints").innerHTML = data.project.points.map(function (point) {
      return `<button class="overview-point" type="button" data-target="${escapeHtml(point.target || "features")}"><strong>${escapeHtml(point.title)}</strong><span>${escapeHtml(point.detail)}</span></button>`;
    }).join("");
    $("#quickActions").innerHTML = data.project.quickActions.map(function (item) {
      return `<button class="quick-action" type="button" data-target="${escapeHtml(item.target)}"><span>${escapeHtml(item.icon || "-")}</span>${escapeHtml(item.label)}</button>`;
    }).join("");
    $$("[data-target]", $("#view-overview")).forEach(function (button) {
      button.addEventListener("click", function () { switchView(button.dataset.target); });
    });
  }

  function renderStats() {
    $("#statsGrid").innerHTML = data.stats.map(function (stat) {
      return `
        <button class="stat-card" type="button" data-target="${escapeHtml(stat.target || "overview")}" style="--icon-bg:${escapeHtml(stat.bg || "#eff6ff")};--icon-color:${escapeHtml(stat.color || "#3b82f6")}">
          <div class="stat-icon" aria-hidden="true">${escapeHtml(stat.icon || "-")}</div>
          <div>
            <h3>${escapeHtml(stat.label)}</h3>
            <strong class="stat-value">${escapeHtml(stat.value)}</strong>
            <span class="stat-note">${escapeHtml(stat.note || "")}</span>
          </div>
        </button>
      `;
    }).join("");

    $$(".stat-card").forEach(function (button) {
      button.addEventListener("click", function () { switchView(button.dataset.target); });
    });
  }

  function renderFeatures() {
    if (!state.selectedFeature && data.features[0]) state.selectedFeature = data.features[0].id || data.features[0].name;
    $("#featureGrid").innerHTML = data.features.map(function (feature, index) {
      const id = feature.id || feature.name || String(index);
      return `
        <button class="feature-card ${state.selectedFeature === id ? "is-selected" : ""}" type="button" data-feature-id="${escapeHtml(id)}" style="--icon-bg:${escapeHtml(feature.bg || "#eef2ff")};--icon-color:${escapeHtml(feature.color || "#6366f1")}">
          <div class="feature-card-head">
            <div class="feature-icon" aria-hidden="true">${escapeHtml(feature.icon || "F")}</div>
            <span class="status-badge">${escapeHtml(feature.status || "已完成")}</span>
          </div>
          <h3>${escapeHtml(feature.name)}</h3>
          <p>${escapeHtml(feature.summary)}</p>
        </button>
      `;
    }).join("");

    $$(".feature-card").forEach(function (card) {
      card.addEventListener("click", function () {
        state.selectedFeature = card.dataset.featureId;
        state.umlScale = 1;
        renderFeatures();
      });
    });

    renderFeatureDetail();
  }

  function getSelectedFeature() {
    const selected = state.selectedFeature;
    return data.features.find(function (feature, index) {
      return (feature.id || feature.name || String(index)) === selected;
    }) || data.features[0] || null;
  }

  function renderFeatureDetail() {
    const feature = getSelectedFeature();
    if (!feature || !$("#featureDetailTitle")) return;

    $("#featureDetailTitle").textContent = feature.name || "未命名模块";
    $("#featureDetailSummary").textContent = feature.detail || feature.summary || "暂无模块说明。";

    const entryPoints = Array.isArray(feature.entryPoints) ? feature.entryPoints : [];
    const classes = Array.isArray(feature.classes) ? feature.classes : [];
    const functions = Array.isArray(feature.functions) ? feature.functions : [];
    const relations = Array.isArray(feature.relations) ? feature.relations : [];
    const diagramEdges = buildFeatureEdges(classes, relations);

    const metaItems = [
      { label: "入口", value: entryPoints.length ? entryPoints.join(" / ") : "待分析" }
    ];

    $("#featureMeta").innerHTML = metaItems.map(function (item) {
      return `<div class="feature-meta-item"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`;
    }).join("");

    renderFeatureUmlDiagram(feature, classes, functions, diagramEdges);
    renderFeatureRelations(diagramEdges);
  }

  function buildFeatureEdges(classes, relations) {
    const edges = [];
    const seen = new Set();

    function addEdge(edge) {
      if (!edge || !edge.from || !edge.to) return;
      const type = normalizeFeatureEdgeType(edge.type || edge.kind || edge.relation);
      const label = edge.label || edge.title || featureEdgeLabel(type);
      const normalized = {
        from: String(edge.from),
        to: String(edge.to),
        label: String(label),
        type: type
      };
      const key = `${normalized.from}->${normalized.to}->${normalized.type}->${normalized.label}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push(normalized);
    }

    classes.forEach(function (item) {
      if (!item || !item.name) return;
      if (item.extends) addEdge({ from: item.name, to: item.extends, type: "inheritance", label: "继承" });
      const implemented = Array.isArray(item.implements) ? item.implements : [];
      implemented.forEach(function (target) {
        addEdge({ from: item.name, to: target, type: "implements", label: "实现" });
      });
    });

    relations.forEach(addEdge);
    return edges;
  }

  function normalizeFeatureEdgeType(type) {
    const value = String(type || "call").toLowerCase();
    if (["inherit", "inherits", "inheritance", "extends", "extend"].includes(value)) return "inheritance";
    if (["implement", "implements", "interface"].includes(value)) return "implements";
    if (["data", "dataflow", "data-flow", "readwrite", "storage"].includes(value)) return "data";
    return "call";
  }

  function featureEdgeLabel(type) {
    if (type === "inheritance") return "继承";
    if (type === "implements") return "实现";
    if (type === "data") return "数据流";
    return "调用";
  }

  function isInheritanceEdge(edge) {
    return edge && (edge.type === "inheritance" || edge.type === "implements");
  }

  function renderFeatureUmlDiagram(feature, classes, functions, edges) {
    const board = $("#featureUmlBoard");
    updateUmlZoomControls();
    const classMap = new Map();
    const names = [];
    const seen = new Set();
    const functionNodeId = "__functions__";

    function addNode(name) {
      if (!name || seen.has(name)) return;
      seen.add(name);
      names.push(name);
    }

    classes.forEach(function (item) {
      if (!item || !item.name) return;
      classMap.set(item.name, item);
      addNode(item.name);
    });

    edges.forEach(function (edge) {
      addNode(edge.from);
      addNode(edge.to);
    });

    if (functions.length) addNode(functionNodeId);

    if (!names.length) {
      board.innerHTML = `<div class="empty-state">暂未从代码中提取到类、继承、方法或函数。重新生成数据后会在这里展示 UML 类图。</div>`;
      return;
    }

    const parentNames = new Set(edges.filter(isInheritanceEdge).map(function (edge) { return edge.to; }));
    const parentNodes = names.filter(function (name) { return name !== functionNodeId && parentNames.has(name); });
    const classNodes = names.filter(function (name) { return name !== functionNodeId && classMap.has(name) && !parentNames.has(name); });
    const externalNodes = names.filter(function (name) { return name !== functionNodeId && !classMap.has(name) && !parentNames.has(name); });
    const functionNodes = names.includes(functionNodeId) ? [functionNodeId] : [];
    const groups = [parentNodes, classNodes, externalNodes, functionNodes].filter(function (group) { return group.length; });

    const nodeWidth = 236;
    const nodeHeight = 190;
    const gapX = 38;
    const gapY = 70;
    const padding = 28;
    const maxCols = Math.min(3, Math.max.apply(null, groups.map(function (group) { return Math.min(3, group.length); })));
    const canvasWidth = padding * 2 + maxCols * nodeWidth + (maxCols - 1) * gapX;
    const positions = new Map();
    let cursorY = padding;

    groups.forEach(function (group) {
      for (let i = 0; i < group.length; i += maxCols) {
        const row = group.slice(i, i + maxCols);
        const rowWidth = row.length * nodeWidth + (row.length - 1) * gapX;
        const startX = padding + Math.max(0, (canvasWidth - padding * 2 - rowWidth) / 2);
        row.forEach(function (name, index) {
          positions.set(name, { x: startX + index * (nodeWidth + gapX), y: cursorY, w: nodeWidth, h: nodeHeight });
        });
        cursorY += nodeHeight + gapY;
      }
    });

    const canvasHeight = Math.max(320, cursorY - gapY + padding);
    const edgeMarkup = edges.map(function (edge, index) {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      const line = umlEdgeLine(from, to, edge.type, index);
      const marker = isInheritanceEdge(edge) ? "url(#umlTriangle)" : "url(#umlArrow)";
      const cssType = `is-${edge.type}`;
      return `
        <path class="uml-edge ${cssType}" data-edge-index="${index}" data-from="${escapeHtml(edge.from)}" data-to="${escapeHtml(edge.to)}" data-type="${escapeHtml(edge.type)}" d="${line.path}" marker-end="${marker}"></path>
      `;
    }).join("");

    const edgeLabelMarkup = edges.map(function (edge, index) {
      const from = positions.get(edge.from);
      const to = positions.get(edge.to);
      if (!from || !to) return "";
      const line = umlEdgeLine(from, to, edge.type, index);
      const label = shortText(edge.label || featureEdgeLabel(edge.type), 30);
      return renderUmlEdgeLabel(index, line, label);
    }).join("");

    const nodeMarkup = names.map(function (name) {
      const position = positions.get(name);
      if (!position) return "";
      if (name === functionNodeId) return renderUmlNode(position, { name: "独立函数", type: "functions", methods: functions }, "functions");
      const item = classMap.get(name) || { name: name, type: parentNames.has(name) ? "base" : "external", methods: [] };
      const nodeKind = classMap.has(name) ? "class" : "external";
      return renderUmlNode(position, item, nodeKind);
    }).join("");

    const scaledWidth = Math.max(320, Math.round(canvasWidth * state.umlScale));
    const scaledHeight = Math.max(260, Math.round(canvasHeight * state.umlScale));
    const viewportWidth = board.clientWidth || scaledWidth;
    const viewportHeight = board.clientHeight || scaledHeight;
    const panPaddingX = Math.max(180, Math.round(viewportWidth * 0.42));
    const panPaddingY = Math.max(100, Math.round(viewportHeight * 0.24));
    const panSpaceWidth = scaledWidth + panPaddingX * 2;
    const panSpaceHeight = scaledHeight + panPaddingY * 2;

    board.innerHTML = `
      <div class="uml-pan-space" style="width:${panSpaceWidth}px;height:${panSpaceHeight}px;padding:${panPaddingY}px ${panPaddingX}px">
        <svg class="uml-svg" style="width:${scaledWidth}px;height:${scaledHeight}px;min-width:${scaledWidth}px" viewBox="0 0 ${canvasWidth} ${canvasHeight}" role="img" aria-label="${escapeHtml(feature.name || "功能模块")} UML 类图">
          <defs>
            <marker id="umlArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"></path>
            </marker>
            <marker id="umlTriangle" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
              <path d="M 1 1 L 11 6 L 1 11 z" fill="#fff" stroke="#7c3aed" stroke-width="1.7"></path>
            </marker>
          </defs>
          ${edgeMarkup}
          ${nodeMarkup}
          ${edgeLabelMarkup}
        </svg>
      </div>
    `;
    bindUmlNodeDragEvents(board);
    window.requestAnimationFrame(function () {
      centerUmlBoardHorizontally(board);
      updateUmlEdges(board);
    });
  }

  function centerUmlBoardHorizontally(board) {
    if (!board) return;
    const maxLeft = Math.max(0, board.scrollWidth - board.clientWidth);
    if (maxLeft > 0) board.scrollLeft = Math.round(maxLeft / 2);
  }

  function renderUmlEdgeLabel(index, line, label) {
    const width = umlEdgeLabelWidth(label);
    return `
      <g class="uml-edge-label-group" data-label-index="${index}" transform="translate(${line.labelX}, ${line.labelY})">
        <rect x="${-width / 2}" y="-19" width="${width}" height="24" rx="12"></rect>
        <text class="uml-edge-label" x="0" y="-3" text-anchor="middle">${escapeHtml(label)}</text>
      </g>
    `;
  }

  function umlEdgeLabelWidth(label) {
    const length = Array.from(String(label || "")).length;
    return Math.min(190, Math.max(58, length * 8 + 24));
  }

  function getUmlNodeDomPosition(node) {
    return {
      x: Number(node.dataset.x || 0),
      y: Number(node.dataset.y || 0),
      w: Number(node.dataset.w || 0),
      h: Number(node.dataset.h || 0)
    };
  }

  function findUmlNodeById(board, id) {
    return $$(".uml-node", board).find(function (node) {
      return node.dataset.nodeId === id;
    });
  }

  function updateUmlEdges(board) {
    if (!board) return;
    $$(".uml-edge", board).forEach(function (edgePath) {
      const fromNode = findUmlNodeById(board, edgePath.dataset.from);
      const toNode = findUmlNodeById(board, edgePath.dataset.to);
      if (!fromNode || !toNode) return;
      const index = Number(edgePath.dataset.edgeIndex || 0);
      const line = umlEdgeLine(getUmlNodeDomPosition(fromNode), getUmlNodeDomPosition(toNode), edgePath.dataset.type, index);
      edgePath.setAttribute("d", line.path);
      const label = $(`.uml-edge-label-group[data-label-index="${index}"]`, board);
      if (label) label.setAttribute("transform", `translate(${line.labelX}, ${line.labelY})`);
    });
  }

  function bindUmlPanEvents() {
    const board = $("#featureUmlBoard");
    board.addEventListener("pointerdown", startUmlPan);
    board.addEventListener("pointermove", moveUmlPan);
    board.addEventListener("pointerup", stopUmlPan);
    board.addEventListener("pointercancel", stopUmlPan);
    board.addEventListener("lostpointercapture", stopUmlPan);
  }

  function bindUmlNodeDragEvents(board) {
    $$(".uml-node", board).forEach(function (node) {
      node.addEventListener("pointerdown", startUmlNodeDrag);
      node.addEventListener("pointermove", moveUmlNodeDrag);
      node.addEventListener("pointerup", stopUmlNodeDrag);
      node.addEventListener("pointercancel", stopUmlNodeDrag);
      node.addEventListener("lostpointercapture", stopUmlNodeDrag);
    });
  }

  function startUmlPan(event) {
    if (event.button !== 0) return;
    if (event.target.closest && event.target.closest(".uml-node")) return;
    const board = $("#featureUmlBoard");
    state.umlPanning = true;
    state.umlPanPointerId = event.pointerId;
    state.umlPanStartX = event.clientX;
    state.umlPanStartY = event.clientY;
    state.umlPanScrollLeft = board.scrollLeft;
    state.umlPanScrollTop = board.scrollTop;
    board.classList.add("is-panning");
    if (board.setPointerCapture) board.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveUmlPan(event) {
    if (!state.umlPanning || event.pointerId !== state.umlPanPointerId) return;
    const board = $("#featureUmlBoard");
    board.scrollLeft = state.umlPanScrollLeft - (event.clientX - state.umlPanStartX);
    board.scrollTop = state.umlPanScrollTop - (event.clientY - state.umlPanStartY);
    event.preventDefault();
  }

  function stopUmlPan(event) {
    if (!state.umlPanning || event.pointerId !== state.umlPanPointerId) return;
    const board = $("#featureUmlBoard");
    state.umlPanning = false;
    state.umlPanPointerId = null;
    board.classList.remove("is-panning");
    if (board.releasePointerCapture && (!board.hasPointerCapture || board.hasPointerCapture(event.pointerId))) board.releasePointerCapture(event.pointerId);
  }

  function startUmlNodeDrag(event) {
    if (event.button !== 0) return;
    const node = event.currentTarget;
    const board = $("#featureUmlBoard");
    state.umlNodeDragging = true;
    state.umlNodePointerId = event.pointerId;
    state.umlNodeStartX = event.clientX;
    state.umlNodeStartY = event.clientY;
    state.umlNodeOriginX = Number(node.dataset.x || 0);
    state.umlNodeOriginY = Number(node.dataset.y || 0);
    node.classList.add("is-dragging");
    board.classList.add("is-dragging-node");
    if (node.setPointerCapture) node.setPointerCapture(event.pointerId);
    event.stopPropagation();
    event.preventDefault();
  }

  function moveUmlNodeDrag(event) {
    if (!state.umlNodeDragging || event.pointerId !== state.umlNodePointerId) return;
    const node = event.currentTarget;
    const scale = state.umlScale || 1;
    const nextX = state.umlNodeOriginX + (event.clientX - state.umlNodeStartX) / scale;
    const nextY = state.umlNodeOriginY + (event.clientY - state.umlNodeStartY) / scale;
    node.dataset.x = String(Math.round(nextX * 10) / 10);
    node.dataset.y = String(Math.round(nextY * 10) / 10);
    node.setAttribute("transform", `translate(${node.dataset.x}, ${node.dataset.y})`);
    updateUmlEdges($("#featureUmlBoard"));
    event.stopPropagation();
    event.preventDefault();
  }

  function stopUmlNodeDrag(event) {
    if (!state.umlNodeDragging || event.pointerId !== state.umlNodePointerId) return;
    const node = event.currentTarget;
    const board = $("#featureUmlBoard");
    state.umlNodeDragging = false;
    state.umlNodePointerId = null;
    node.classList.remove("is-dragging");
    board.classList.remove("is-dragging-node");
    if (node.releasePointerCapture && (!node.hasPointerCapture || node.hasPointerCapture(event.pointerId))) node.releasePointerCapture(event.pointerId);
    event.stopPropagation();
  }
  function setUmlScale(nextScale) {
    const scale = Math.min(2.4, Math.max(0.6, Number(nextScale.toFixed(2))));
    if (scale === state.umlScale) return;
    state.umlScale = scale;
    renderFeatureDetail();
  }

  function updateUmlZoomControls() {
    const value = $("#umlZoomValue");
    if (!value) return;
    value.textContent = `${Math.round(state.umlScale * 100)}%`;
    $("#umlZoomOut").disabled = state.umlScale <= 0.6;
    $("#umlZoomIn").disabled = state.umlScale >= 2.4;
  }

  function toggleUmlFullscreen(force) {
    const shell = $("#featureUmlShell");
    if (!shell) return;
    const isOpen = typeof force === "boolean" ? force : !shell.classList.contains("is-fullscreen");
    shell.classList.toggle("is-fullscreen", isOpen);
    $("#umlFullscreen").textContent = isOpen ? "退出全屏" : "全屏查看";
    window.requestAnimationFrame(function () { centerUmlBoardHorizontally($("#featureUmlBoard")); });
  }
  function renderUmlNode(position, item, kind) {
    const properties = Array.isArray(item.properties) ? item.properties : [];
    const methods = Array.isArray(item.methods) ? item.methods : [];
    const propLines = kind === "functions" ? ["模块级工具函数"] : (properties.length ? properties : [kind === "external" ? "外部依赖" : "属性待提取"]);
    const methodLines = methods.length ? methods : [kind === "external" ? "由关系图引用" : "方法待提取"];
    const propMarkup = renderUmlTextLines(propLines, 72, 2, kind === "functions" ? "scope" : "+");
    const methodMarkup = renderUmlTextLines(methodLines, 130, 3, kind === "functions" ? "fn" : "+");

    return `
      <g class="uml-node is-${escapeHtml(kind)}" data-node-id="${escapeHtml(item.name || "Unnamed")}" data-x="${position.x}" data-y="${position.y}" data-w="${position.w}" data-h="${position.h}" transform="translate(${position.x}, ${position.y})">
        <rect class="uml-node-box" width="${position.w}" height="${position.h}" rx="8"></rect>
        ${renderSvgTextBlock("uml-node-type", item.type || kind, position.w / 2, 22, "middle", 30, 1, 12)}
        ${renderSvgTextBlock("uml-node-title", item.name || "Unnamed", position.w / 2, 40, "middle", 28, 2, 15)}
        <line class="uml-divider" x1="0" x2="${position.w}" y1="62" y2="62"></line>
        ${propMarkup}
        <line class="uml-divider" x1="0" x2="${position.w}" y1="120" y2="120"></line>
        ${methodMarkup}
      </g>
    `;
  }

  function renderUmlTextLines(items, startY, maxLines, prefix) {
    const shown = items.slice(0, maxLines);
    const rows = [];
    const visualLineLimit = startY < 100 ? 3 : 4;
    let y = startY;
    let usedLines = 0;
    let truncated = false;

    shown.forEach(function (item) {
      if (usedLines >= visualLineLimit) {
        truncated = true;
        return;
      }
      const wrapped = wrapSvgText(`${prefix} ${item}`, 31, Math.min(2, visualLineLimit - usedLines));
      wrapped.forEach(function (line) {
        rows.push(`<text class="uml-node-line" x="12" y="${y}">${escapeHtml(line)}</text>`);
        y += 15;
        usedLines += 1;
      });
    });

    if (items.length > maxLines || truncated) {
      rows.push(`<text class="uml-node-line is-more" x="12" y="${y}">+ ${Math.max(1, items.length - shown.length)} more</text>`);
    }
    return rows.join("");
  }

  function umlEdgeLine(from, to, type, index) {
    const fromCenterX = from.x + from.w / 2;
    const fromCenterY = from.y + from.h / 2;
    const toCenterX = to.x + to.w / 2;
    const toCenterY = to.y + to.h / 2;
    const offset = (index % 3 - 1) * 10;
    let start;
    let end;

    if (type === "inheritance" || type === "implements") {
      start = { x: fromCenterX + offset, y: from.y };
      end = { x: toCenterX + offset, y: to.y + to.h };
    } else if (Math.abs(fromCenterY - toCenterY) < 30) {
      const leftToRight = fromCenterX <= toCenterX;
      start = { x: from.x + (leftToRight ? from.w : 0), y: fromCenterY + offset };
      end = { x: to.x + (leftToRight ? 0 : to.w), y: toCenterY + offset };
    } else {
      const topToBottom = fromCenterY <= toCenterY;
      start = { x: fromCenterX + offset, y: from.y + (topToBottom ? from.h : 0) };
      end = { x: toCenterX + offset, y: to.y + (topToBottom ? 0 : to.h) };
    }

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    return {
      path: `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`,
      labelX: midX,
      labelY: midY - 8
    };
  }

  function shortText(value, maxLength) {
    const text = String(value == null ? "" : value);
    return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
  }

  function wrapSvgText(value, maxChars, maxLines) {
    const text = String(value == null ? "" : value).trim() || "-";
    const lines = [];
    let rest = text;
    while (rest.length && lines.length < maxLines) {
      if (rest.length <= maxChars) {
        lines.push(rest);
        rest = "";
      } else {
        let index = rest.lastIndexOf(" ", maxChars);
        if (index < Math.floor(maxChars * 0.55)) index = maxChars;
        lines.push(rest.slice(0, index).trim());
        rest = rest.slice(index).trim();
      }
    }
    if (rest && lines.length) {
      lines[lines.length - 1] = shortText(lines[lines.length - 1], Math.max(4, maxChars));
    }
    return lines.length ? lines : ["-"];
  }

  function renderSvgTextBlock(className, value, x, y, anchor, maxChars, maxLines, lineHeight) {
    const lines = wrapSvgText(value, maxChars, maxLines);
    return `
      <text class="${className}" x="${x}" y="${y}" text-anchor="${anchor}">
        ${lines.map(function (line, index) {
          return `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeHtml(line)}</tspan>`;
        }).join("")}
      </text>
    `;
  }

  function renderFeatureRelations(edges) {
    $("#featureRelationPanel").innerHTML = `
      <h4>关系明细</h4>
      <div class="relation-list">
        ${edges.length ? edges.map(function (edge) {
          return `<div class="relation-item is-${escapeHtml(edge.type)}"><code>${escapeHtml(edge.from)}</code><span>${escapeHtml(edge.label || featureEdgeLabel(edge.type))}</span><code>${escapeHtml(edge.to)}</code></div>`;
        }).join("") : `<div class="empty-state compact">暂未确认该功能内部的类关系、继承关系或调用关系。</div>`}
      </div>
    `;
  }
  function openSelectedFeatureDemo() {
    const feature = getSelectedFeature();
    const featureId = feature && (feature.id || feature.name);
    const demoIndex = data.demos.findIndex(function (demo) { return demo.featureId === featureId; });
    if (demoIndex >= 0) {
      selectDemo(demoIndex);
      switchView("demo");
    } else {
      showToast("当前功能还没有可用演示。");
    }
  }

  function renderGraph() {
    const svg = $("#moduleGraph");
    const nodes = data.graph.nodes || [];
    const edges = data.graph.edges || [];
    const byId = new Map(nodes.map(function (node) { return [node.id, node]; }));

    svg.setAttribute("viewBox", "0 0 760 520");
    const edgeMarkup = edges.map(function (edge) {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) return "";
      const start = edgePoint(from, to);
      const end = edgePoint(to, from);
      const curve = Math.abs(start.x - end.x) < 20 ? `M ${start.x} ${start.y} L ${end.x} ${end.y}` : `M ${start.x} ${start.y} C ${start.x} ${(start.y + end.y) / 2}, ${end.x} ${(start.y + end.y) / 2}, ${end.x} ${end.y}`;
      return `<path class="graph-edge ${edge.type === "data" ? "is-data" : ""}" d="${curve}" marker-end="url(#arrow)"></path>`;
    }).join("");

    const nodeMarkup = nodes.map(function (node) {
      return `
        <g class="graph-node" transform="translate(${node.x}, ${node.y})" style="--node-color:${escapeHtml(node.color || "#bfdbfe")}">
          <rect width="132" height="64"></rect>
          ${renderSvgTextBlock("graph-node-label", node.label, 66, 22, "middle", 11, 2, 13)}
          ${renderSvgTextBlock("node-type", node.typeLabel || node.type || "Module", 66, 51, "middle", 15, 1, 12)}
        </g>
      `;
    }).join("");

    svg.innerHTML = `
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"></path>
        </marker>
      </defs>
      ${edgeMarkup}
      ${nodeMarkup}
    `;
  }

  function edgePoint(a, b) {
    const ax = a.x + 66;
    const ay = a.y + 32;
    const bx = b.x + 66;
    const by = b.y + 32;
    if (Math.abs(ax - bx) > Math.abs(ay - by)) return { x: ax + (bx > ax ? 66 : -66), y: ay };
    return { x: ax, y: ay + (by > ay ? 32 : -32) };
  }

  function renderRuntime() {
    $("#runtimeTimeline").innerHTML = data.runtimeSteps.map(function (step, index) {
      return `
        <li class="timeline-item" style="--step-bg:${escapeHtml(step.bg || "#eef2ff")};--step-color:${escapeHtml(step.color || "#4f46e5")}">
          <span class="timeline-index">${index + 1}</span>
          <div class="timeline-copy"><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.detail)}</p></div>
        </li>
      `;
    }).join("");
  }

  function renderDemos() {
    $("#demoMenu").innerHTML = data.demos.map(function (demo, index) {
      return `<button class="demo-menu-item ${index === state.selectedDemo ? "is-active" : ""}" type="button" data-demo-index="${index}">${escapeHtml(demo.name)}</button>`;
    }).join("");
    $$(".demo-menu-item").forEach(function (button) {
      button.addEventListener("click", function () { selectDemo(Number(button.dataset.demoIndex)); });
    });
    renderDemoStage();
  }

  function selectDemo(index) {
    state.selectedDemo = index;
    state.selectedDemoStep = 0;
    renderDemos();
  }

  function renderDemoStage() {
    const demo = data.demos[state.selectedDemo];
    if (!demo) return;
    $("#demoTitle").textContent = demo.title || demo.name;
    $("#demoDescription").textContent = demo.description || "";
    const steps = demo.steps || [];
    if (!steps[state.selectedDemoStep]) state.selectedDemoStep = 0;

    $("#demoFlow").innerHTML = steps.map(function (step, index) {
      return `
        <button class="demo-step-card ${index === state.selectedDemoStep ? "is-active" : ""}" type="button" data-step-index="${index}">
          <span>步骤 ${index + 1}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.summary)}</p>
        </button>
      `;
    }).join("");
    $$(".demo-step-card").forEach(function (button) {
      button.addEventListener("click", function () { state.selectedDemoStep = Number(button.dataset.stepIndex); renderDemoStage(); });
    });
    renderDemoPreview(steps[state.selectedDemoStep] || {});
  }

  function renderDemoPreview(step) {
    const fields = step.fields || [];
    const rows = step.rows || [];
    $("#demoPreview").innerHTML = `
      <section class="mock-card"><h3>${escapeHtml(step.previewTitle || "操作面板")}</h3><div class="mock-form">
        ${fields.map(function (field) { return `<label class="mock-field">${escapeHtml(field.label)}<span class="mock-input">${escapeHtml(field.value)}</span></label>`; }).join("")}
        <button class="mock-button" type="button">${escapeHtml(step.action || "执行操作")}</button>
      </div></section>
      <section class="mock-card"><h3>${escapeHtml(step.resultTitle || "结果预览")}</h3><table class="mock-table">
        <thead><tr><th>ID</th><th>名称</th><th>状态</th></tr></thead>
        <tbody>${rows.map(function (row) { return `<tr><td>${escapeHtml(row.id)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.status)}</td></tr>`; }).join("")}</tbody>
      </table></section>
    `;
  }

  function moveDemoStep(delta) {
    const demo = data.demos[state.selectedDemo];
    if (!demo || !demo.steps || !demo.steps.length) return;
    state.selectedDemoStep = (state.selectedDemoStep + delta + demo.steps.length) % demo.steps.length;
    renderDemoStage();
  }

  function toggleAutoplay(event) {
    window.clearInterval(state.autoplayTimer);
    state.autoplayTimer = null;
    if (event.target.checked) {
      state.autoplayTimer = window.setInterval(function () { moveDemoStep(1); }, 1800);
      showToast("自动播放已开启");
    } else {
      showToast("自动播放已关闭");
    }
  }

  function renderDirectory() {
    const query = state.directoryQuery;
    const rows = data.codeDirectory.filter(function (item) {
      const haystack = [item.file, item.responsibility, item.reason].concat(item.features || []).join(" ").toLowerCase();
      return !query || haystack.includes(query);
    });
    $("#directoryTable").innerHTML = rows.map(function (item) {
      return `<tr><td>${escapeHtml(item.file)}</td><td>${escapeHtml(item.responsibility)}</td><td><div class="tag-list">${(item.features || []).map(function (feature) { return `<span class="tag">${escapeHtml(feature)}</span>`; }).join("")}</div></td><td>${escapeHtml(item.reason)}</td></tr>`;
    }).join("") || `<tr><td colspan="4">没有匹配的文件</td></tr>`;
  }

  function renderTests() {
    const tests = data.tests || { items: [] };
    const items = Array.isArray(tests.items) ? tests.items : [];
    if (!items[state.selectedTest]) state.selectedTest = 0;
    const selected = items[state.selectedTest] || null;

    $("#testsLayout").innerHTML = `
      <section class="test-summary-card">
        <p class="section-label">Coverage</p>
        <strong>${escapeHtml(tests.coverage || "-")}</strong>
        <span>${escapeHtml(tests.summary || "暂无测试信息")}</span>
      </section>
      <div class="test-workspace">
        <div class="test-list" aria-label="测试模块列表">
          ${items.map(function (item, index) {
            return `<button class="test-card ${index === state.selectedTest ? "is-active" : ""}" type="button" data-test-index="${index}"><span>${escapeHtml(item.type || "Test")}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.detail)}</p><strong>${escapeHtml(item.status || "已通过")}</strong></button>`;
          }).join("") || `<div class="empty-state compact">暂无测试模块。</div>`}
        </div>
        ${renderTestCasePanel(selected)}
      </div>
    `;

    $$(".test-card").forEach(function (button) {
      button.addEventListener("click", function () {
        state.selectedTest = Number(button.dataset.testIndex);
        renderTests();
      });
    });
  }

  function renderTestCasePanel(item) {
    if (!item) return `<section class="test-case-panel"><div class="empty-state">选择一个测试模块查看测试用例。</div></section>`;
    const cases = Array.isArray(item.cases) ? item.cases : [];
    return `
      <section class="test-case-panel" aria-label="测试用例详情">
        <div class="test-case-head">
          <div>
            <p class="section-label">Test Cases</p>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.detail || "查看该测试模块覆盖的核心场景。")}</p>
          </div>
          <strong>${escapeHtml(item.status || "已通过")}</strong>
        </div>
        <div class="test-case-meta">
          <div><span>测试文件</span><code>${escapeHtml(item.file || "待分析")}</code></div>
          <div><span>运行命令</span><code>${escapeHtml(item.command || "待分析")}</code></div>
          <div><span>用例数量</span><code>${cases.length} 个</code></div>
        </div>
        <div class="test-case-list">
          ${cases.length ? cases.map(function (testCase, index) {
            return `
              <article class="test-case-item">
                <span class="test-case-index">${index + 1}</span>
                <div>
                  <div class="test-case-title"><h4>${escapeHtml(testCase.name)}</h4><strong>${escapeHtml(testCase.status || "已通过")}</strong></div>
                  <p>${escapeHtml(testCase.scenario || testCase.detail || "暂无场景说明")}</p>
                  <code>${escapeHtml(testCase.assertion || "断言待分析")}</code>
                </div>
              </article>
            `;
          }).join("") : `<div class="empty-state compact">该测试模块暂未提取到测试用例。</div>`}
        </div>
      </section>
    `;
  }
  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 2200);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
