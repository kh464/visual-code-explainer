window.CODE_EXPLAINER_DATA = {
  navigation: [
    { id: "overview", label: "项目总览", icon: "总" },
    { id: "features", label: "功能模块", icon: "能" },
    { id: "architecture", label: "模块关系", icon: "联" },
    { id: "runtime", label: "运行流程", icon: "流" },
    { id: "demo", label: "演示体验", icon: "演" },
    { id: "directory", label: "代码目录", icon: "文" },
    { id: "tests", label: "测试覆盖", icon: "测" }
  ],
  project: {
    name: "CodeX 项目演示",
    version: "v1.8.0",
    updatedAt: "2026-05-28",
    generatedAt: "2026-05-28 15:30",
    generator: "CodeX",
    title: "你好！我是 CodeX",
    subtitle: "我已为你分析并生成了项目的可视化说明",
    summary: "这个演示面板把项目功能、核心文件、模块关系、运行流程、交互演示和测试质量拆成可点击页面，用户无需滚动即可逐块理解代码做了什么。",
    points: [
      { title: "功能清晰", detail: "先看当前项目有哪些已实现能力。", target: "features" },
      { title: "关系明确", detail: "再看前端、网关、业务模块和数据库如何协作。", target: "architecture" },
      { title: "流程可追", detail: "用时间线理解一次请求如何完成。", target: "runtime" },
      { title: "代码可读", detail: "直接进入关键文件和测试入口。", target: "directory" }
    ],
    quickActions: [
      { label: "查看功能模块", icon: "能", target: "features" },
      { label: "打开模块关系", icon: "联", target: "architecture" },
      { label: "查看代码目录", icon: "文", target: "directory" },
      { label: "查看测试覆盖", icon: "测", target: "tests" }
    ]
  },
  stats: [
    { label: "功能模块", value: "6", note: "点击查看功能", icon: "能", target: "features", bg: "#eef2ff", color: "#4f46e5" },
    { label: "核心文件", value: "28", note: "点击打开目录", icon: "文", target: "directory", bg: "#eff6ff", color: "#2563eb" },
    { label: "模块关系", value: "12", note: "点击查看关系", icon: "联", target: "architecture", bg: "#f5f3ff", color: "#7c3aed" },
    { label: "运行流程", value: "8", note: "点击查看流程", icon: "流", target: "runtime", bg: "#fff7ed", color: "#ea580c" },
    { label: "单元测试", value: "86%", note: "点击查看测试", icon: "测", target: "tests", bg: "#ecfdf3", color: "#16a34a" }
  ],
  features: [
    {
      id: "user",
      name: "用户管理",
      summary: "注册、登录、权限和用户资料维护。",
      detail: "用户管理模块负责接收页面操作，校验账号信息，并通过服务层完成会话、权限和资料更新。",
      status: "已完成",
      icon: "用",
      bg: "#eff6ff",
      color: "#2563eb",
      entryPoints: ["/users", "POST /api/users/login"],
      files: ["src/pages/UserPage.tsx", "src/services/userService.ts", "src/repositories/userRepository.ts"],
      classes: [
        { name: "UserPage", type: "component", extends: "BasePage", methods: ["handleRegister()", "handleLogin()", "refreshUserList()"] },
        { name: "UserService", type: "service", extends: "BaseService", methods: ["registerUser()", "login()", "loadProfile()", "updateProfile()"] },
        { name: "UserRepository", type: "repository", extends: "BaseRepository", methods: ["findByEmail()", "save()", "updateProfile()"] }
      ],
      functions: ["validateUserInput()", "createSessionToken()", "mapUserDto()"],
      relations: [
        { from: "UserPage", to: "UserService", label: "调用", type: "call" },
        { from: "UserService", to: "UserRepository", label: "读写", type: "data" },
        { from: "UserService", to: "AuthGuard", label: "校验", type: "call" }
      ]
    },
    {
      id: "task",
      name: "任务管理",
      summary: "创建任务、分配负责人并跟踪状态。",
      detail: "任务管理模块把表单输入转换为任务实体，并协调分配、状态更新和通知触发。",
      status: "已完成",
      icon: "任",
      bg: "#f5f3ff",
      color: "#7c3aed",
      entryPoints: ["/tasks", "POST /api/tasks"],
      files: ["src/pages/TaskBoard.tsx", "src/services/taskService.ts", "src/repositories/taskRepository.ts"],
      classes: [
        { name: "TaskBoard", type: "component", extends: "BaseBoard", methods: ["submitTask()", "assignMember()", "changeStatus()"] },
        { name: "TaskService", type: "service", extends: "BaseService", methods: ["createTask()", "assignTask()", "updateTaskStatus()"] },
        { name: "TaskRepository", type: "repository", extends: "BaseRepository", methods: ["insert()", "updateStatus()", "findByAssignee()"] }
      ],
      functions: ["normalizeTaskPayload()", "calculatePriority()", "groupTasksByStatus()"],
      relations: [
        { from: "TaskBoard", to: "TaskService", label: "调用", type: "call" },
        { from: "TaskService", to: "TaskRepository", label: "保存", type: "data" },
        { from: "TaskService", to: "NotificationService", label: "触发", type: "call" }
      ]
    },
    {
      id: "category",
      name: "任务分类",
      summary: "按业务类型管理任务分组和标签。",
      detail: "分类模块维护任务标签、分组和过滤条件，帮助看板和统计模块复用同一套分类规则。",
      status: "已完成",
      icon: "类",
      bg: "#fff7ed",
      color: "#ea580c",
      entryPoints: ["/categories", "GET /api/categories"],
      files: ["src/services/categoryService.ts", "src/models/category.ts"],
      classes: [
        { name: "CategoryService", type: "service", extends: "BaseService", methods: ["listCategories()", "createCategory()", "attachTask()"] },
        { name: "CategoryModel", type: "model", extends: "BaseEntity", properties: ["id", "name", "color", "taskCount"], methods: ["rename()", "markArchived()"] }
      ],
      functions: ["buildCategoryTree()", "matchCategoryFilter()"],
      relations: [
        { from: "CategoryService", to: "CategoryModel", label: "构建", type: "call" },
        { from: "TaskService", to: "CategoryService", label: "读取", type: "data" }
      ]
    },
    {
      id: "kanban",
      name: "任务看板",
      summary: "用看板视图展示任务推进阶段。",
      detail: "看板模块负责列布局、拖拽排序和状态切换，把任务状态变化同步回服务层。",
      status: "已完成",
      icon: "板",
      bg: "#ecfeff",
      color: "#0891b2",
      entryPoints: ["/board"],
      files: ["src/pages/TaskBoard.tsx", "src/components/KanbanColumn.tsx", "src/services/taskService.ts"],
      classes: [
        { name: "KanbanBoard", type: "component", extends: "BaseBoard", methods: ["renderColumns()", "onCardDrop()", "refreshBoard()"] },
        { name: "DragDropController", type: "controller", extends: "BaseController", methods: ["startDrag()", "moveCard()", "commitDrop()"] }
      ],
      functions: ["sortCardsByRank()", "deriveColumnSummary()"],
      relations: [
        { from: "KanbanBoard", to: "DragDropController", label: "委托", type: "call" },
        { from: "DragDropController", to: "TaskService", label: "更新状态", type: "call" },
        { from: "TaskService", to: "TaskRepository", label: "写入", type: "data" }
      ]
    },
    {
      id: "analytics",
      name: "数据统计",
      summary: "汇总任务趋势、完成率和团队效率。",
      detail: "统计模块读取任务和分类数据，聚合为趋势、完成率和团队效率指标，供仪表盘展示。",
      status: "已完成",
      icon: "统",
      bg: "#fdf2f8",
      color: "#db2777",
      entryPoints: ["/analytics", "GET /api/analytics/summary"],
      files: ["src/components/AnalyticsPanel.tsx", "src/services/reportService.ts"],
      classes: [
        { name: "AnalyticsPanel", type: "component", extends: "DashboardWidget", methods: ["loadMetrics()", "renderTrend()", "renderSummaryCards()"] },
        { name: "ReportService", type: "service", extends: "BaseService", methods: ["getTaskTrend()", "getCompletionRate()", "getTeamEfficiency()"] }
      ],
      functions: ["aggregateByWeek()", "formatMetricValue()", "buildTrendSeries()"],
      relations: [
        { from: "AnalyticsPanel", to: "ReportService", label: "请求", type: "call" },
        { from: "ReportService", to: "TaskRepository", label: "读取", type: "data" },
        { from: "ReportService", to: "CategoryService", label: "分组", type: "call" }
      ]
    },
    {
      id: "notice",
      name: "通知系统",
      summary: "在关键节点向相关成员发送提醒。",
      detail: "通知系统监听任务创建、分配和状态变化，把事件转换为站内消息或邮件提醒。",
      status: "已完成",
      icon: "通",
      bg: "#ecfdf3",
      color: "#16a34a",
      entryPoints: ["POST /api/notifications"],
      files: ["src/services/notificationService.ts", "src/queues/notificationQueue.ts"],
      classes: [
        { name: "NotificationService", type: "service", extends: "BaseService", methods: ["notifyAssignee()", "notifyStatusChange()", "markAsRead()"] },
        { name: "NotificationQueue", type: "queue", extends: "BaseQueue", methods: ["enqueue()", "retryFailed()", "flush()"] },
        { name: "MailAdapter", type: "adapter", extends: "BaseAdapter", methods: ["sendMail()", "renderTemplate()"] }
      ],
      functions: ["buildNotificationPayload()", "pickRecipients()"],
      relations: [
        { from: "TaskService", to: "NotificationService", label: "触发", type: "call" },
        { from: "NotificationService", to: "NotificationQueue", label: "入队", type: "data" },
        { from: "NotificationQueue", to: "MailAdapter", label: "发送", type: "call" }
      ]
    }
  ],
  graph: {
    nodes: [
      { id: "frontend", label: "前端页面", typeLabel: "UI", x: 314, y: 26, color: "#93c5fd" },
      { id: "gateway", label: "API Gateway", typeLabel: "Router", x: 314, y: 126, color: "#c4b5fd" },
      { id: "user", label: "用户模块", typeLabel: "Service", x: 76, y: 246, color: "#bfdbfe" },
      { id: "task", label: "任务模块", typeLabel: "Service", x: 244, y: 246, color: "#ddd6fe" },
      { id: "category", label: "分类模块", typeLabel: "Service", x: 412, y: 246, color: "#fed7aa" },
      { id: "notice", label: "通知模块", typeLabel: "Service", x: 580, y: 246, color: "#fbcfe8" },
      { id: "database", label: "数据库", typeLabel: "Storage", x: 314, y: 390, color: "#bbf7d0" }
    ],
    edges: [
      { from: "frontend", to: "gateway", type: "call" },
      { from: "gateway", to: "user", type: "call" },
      { from: "gateway", to: "task", type: "call" },
      { from: "gateway", to: "category", type: "call" },
      { from: "gateway", to: "notice", type: "call" },
      { from: "user", to: "database", type: "data" },
      { from: "task", to: "database", type: "data" },
      { from: "category", to: "database", type: "data" },
      { from: "notice", to: "database", type: "data" }
    ]
  },
  runtimeSteps: [
    { title: "用户发起请求", detail: "用户在前端页面进行操作。", bg: "#eff6ff", color: "#2563eb" },
    { title: "前端请求处理", detail: "前端组件接收并处理请求。", bg: "#f5f3ff", color: "#7c3aed" },
    { title: "API 接口调用", detail: "通过 API Gateway 路由请求。", bg: "#ecfeff", color: "#0891b2" },
    { title: "业务逻辑处理", detail: "对应模块执行业务逻辑。", bg: "#fff7ed", color: "#ea580c" },
    { title: "数据库读写", detail: "读写数据库，完成数据操作。", bg: "#ecfdf3", color: "#16a34a" },
    { title: "结果返回", detail: "返回处理结果给前端。", bg: "#fdf2f8", color: "#db2777" },
    { title: "前端渲染更新", detail: "前端更新页面显示结果。", bg: "#eef2ff", color: "#4f46e5" },
    { title: "流程结束", detail: "一次完整的请求流程结束。", bg: "#f8fafc", color: "#475569" }
  ],
  demos: [
    {
      featureId: "user",
      name: "用户管理演示",
      title: "用户管理功能演示",
      description: "展示用户注册、登录、信息管理流程。",
      steps: [
        { title: "用户注册", summary: "填写账号信息并创建新用户。", previewTitle: "注册表单", action: "创建用户", fields: [{ label: "用户名", value: "alice" }, { label: "邮箱", value: "alice@example.com" }, { label: "角色", value: "项目成员" }], resultTitle: "新增用户", rows: [{ id: "U-101", name: "Alice", status: "已注册" }, { id: "U-102", name: "Bob", status: "待激活" }] },
        { title: "用户登录", summary: "校验身份并建立会话。", previewTitle: "登录请求", action: "登录系统", fields: [{ label: "账号", value: "alice@example.com" }, { label: "密码", value: "********" }, { label: "校验", value: "JWT Token" }], resultTitle: "登录结果", rows: [{ id: "S-201", name: "Alice Session", status: "在线" }, { id: "S-202", name: "权限策略", status: "已加载" }] },
        { title: "用户列表", summary: "展示用户资料并支持管理操作。", previewTitle: "筛选条件", action: "刷新列表", fields: [{ label: "关键字", value: "产品" }, { label: "状态", value: "启用" }, { label: "排序", value: "最近登录" }], resultTitle: "用户表格", rows: [{ id: "U-101", name: "Alice", status: "启用" }, { id: "U-105", name: "Chen", status: "启用" }] }
      ]
    },
    {
      featureId: "task",
      name: "任务创建演示",
      title: "任务创建功能演示",
      description: "模拟任务创建、分配和状态更新。",
      steps: [
        { title: "填写任务", summary: "录入标题、截止时间和负责人。", previewTitle: "任务表单", action: "保存任务", fields: [{ label: "标题", value: "完成登录页" }, { label: "负责人", value: "Alice" }, { label: "优先级", value: "高" }], resultTitle: "任务记录", rows: [{ id: "T-301", name: "完成登录页", status: "待处理" }] },
        { title: "分配成员", summary: "把任务分派给团队成员。", previewTitle: "成员选择", action: "确认分配", fields: [{ label: "成员", value: "Alice" }, { label: "角色", value: "前端" }], resultTitle: "分配结果", rows: [{ id: "T-301", name: "Alice", status: "已分配" }] },
        { title: "状态更新", summary: "任务进入执行阶段。", previewTitle: "状态切换", action: "更新状态", fields: [{ label: "当前状态", value: "进行中" }], resultTitle: "看板状态", rows: [{ id: "T-301", name: "完成登录页", status: "进行中" }] }
      ]
    }
  ],
  codeDirectory: [
    { file: "src/pages/UserPage.tsx", responsibility: "用户管理页面入口", features: ["用户管理"], reason: "从这里可以理解用户注册、登录和资料维护的界面组织。" },
    { file: "src/services/userService.ts", responsibility: "用户业务逻辑", features: ["用户管理"], reason: "负责调用接口、处理用户状态和返回结果。" },
    { file: "src/pages/TaskBoard.tsx", responsibility: "任务看板页面", features: ["任务管理", "任务看板"], reason: "展示任务状态流转和看板交互。" },
    { file: "src/services/taskService.ts", responsibility: "任务业务逻辑", features: ["任务管理", "任务分类"], reason: "连接任务创建、分类、状态更新和通知。" },
    { file: "src/api/gateway.ts", responsibility: "API Gateway 路由", features: ["模块关系", "运行流程"], reason: "理解请求如何从前端进入后端模块。" },
    { file: "src/components/AnalyticsPanel.tsx", responsibility: "统计面板组件", features: ["数据统计"], reason: "展示指标卡片和趋势图的渲染方式。" }
  ],
  tests: {
    coverage: "86%",
    summary: "当前示例展示单元测试覆盖率、关键测试文件和测试状态。",
    items: [
      { type: "Unit", name: "用户服务测试", detail: "覆盖注册、登录、权限校验。", status: "已通过" },
      { type: "Unit", name: "任务服务测试", detail: "覆盖任务创建、分配、状态更新。", status: "已通过" },
      { type: "Component", name: "看板组件测试", detail: "覆盖任务拖拽和列状态渲染。", status: "已通过" },
      { type: "API", name: "网关路由测试", detail: "覆盖接口路由和错误处理。", status: "已通过" }
    ]
  }
};