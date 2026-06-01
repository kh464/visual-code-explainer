# Visual Code Explainer

一个 Codex skill，用来给项目生成可交互的代码说明页面。

它适合放在你自己的 Codex skills 目录里。当你让 Codex 分析某个项目时，这个 skill 会让 Codex 先读代码，再生成一个静态 Dashboard。页面里会整理项目功能、关键文件、模块关系、运行流程、UML 类图、测试用例和简单的交互演示。

简单说，它做的是一件事：帮人更快看懂一个项目。

## 为什么写这个

接手一个项目时，最花时间的往往不是安装依赖，而是建立一张“项目地图”。

你可能会先问这些问题：

- 入口在哪里？
- 哪些文件负责核心功能？
- 一个功能从页面到接口再到数据库是怎么走的？
- 类和类之间有没有继承、实现或调用关系？
- 测试覆盖了哪些场景？
- README 里的描述和当前代码还对得上吗？

代码搜索能找到碎片，普通文档又经常跟不上代码变化。这个 skill 想补上中间这一层：让 Codex 把读到的代码结构整理成一页可以点击查看的说明面板。

## 它会生成什么

默认输出是一个静态页面：

```text
docs/code-explainer/
├── index.html
├── styles.css
├── app.js
└── template-data.js
```

页面里有这些内容：

- 项目总览和统计卡片
- 功能模块列表
- 模块关系图
- 运行流程时间线
- 可缩放、可拖动、可全屏查看的 SVG UML 类图
- 类继承、接口实现、调用关系和数据流
- 功能演示区
- 代码目录和阅读理由
- 测试模块、测试文件和测试用例

模板文件在：

```text
assets/code-explainer-template/
```

模板本身是固定的。不同项目主要替换 `template-data.js`，这样页面样式和交互比较稳定，不会每次生成都变一个样。

## 适合什么项目

不只适合前端项目。

可以用于：

- 前端项目：页面、组件、状态、API 调用、用户流程。
- 后端项目：路由、控制器、服务、模型、数据库访问。
- CLI 项目：命令、参数、执行流程、输出结果。
- SDK 或类库：公开 API、核心类、适配器、扩展点。
- 数据项目：数据源、清洗任务、转换逻辑、调度流程。
- 基础设施项目：模块、资源、环境、部署流程、依赖关系。

如果某个项目没有前端页面，skill 不会强行编一个“用户管理系统”。它会按项目实际类型组织内容。

## 安装

把这个仓库放到 Codex 的 skills 目录下即可。

Windows 示例：

```powershell
git clone https://github.com/kh464/visual-code-explainer.git C:\Users\<你的用户名>\.codex\skills\visual-code-explainer
```

macOS / Linux 示例：

```bash
git clone https://github.com/kh464/visual-code-explainer.git ~/.codex/skills/visual-code-explainer
```

目录里需要包含 `SKILL.md`，Codex 才能识别这个 skill。

## 使用

进入你要分析的项目目录，然后对 Codex 说：

```text
使用 visual-code-explainer 生成当前项目的代码理解演示页面
```

或者：

```text
Use $visual-code-explainer to generate a visual explanation page for this codebase.
```

生成完成后，通常打开：

```text
docs/code-explainer/index.html
```

如果 Codex 把页面集成到了现有前端项目里，就按那个项目原本的方式启动。

## 后续更新怎么处理

这个 skill 不要求每次都全盘扫描项目。

默认策略是：

- 第一次使用：完整扫描项目，生成页面和项目索引。
- 后续修改：优先只分析变动文件和受影响的关系。
- 每隔一段改动：强制全盘扫描一次，避免长期增量更新带来偏差。

扫描策略写在：

```text
scan-policy.yaml
```

其中这项控制“每隔多少批改动做一次全盘扫描”：

```yaml
scan_policy:
  full_scan_every_change_batches: 10
```

你可以按项目规模调整。项目小，可以调低；项目大、变动频繁，可以调高一点。

## 为什么使用固定模板

如果每次都让 Codex 从零写页面，效果会不稳定：这次是文档页，下次是截图感很强的静态页面，再下次可能交互失效。

所以这里把页面拆成两部分：

- `index.html`、`styles.css`、`app.js`：稳定的前端模板。
- `template-data.js`：根据具体项目生成的数据。

平时更新项目说明，只改数据文件。只有明确要改页面样式或交互时，才需要动模板。

## 数据要求

生成内容要尽量来自真实代码。

这个 skill 的约定是：

- 不编造功能、文件、接口、类或测试。
- 优先从源码、路由、API、服务、模型、测试和项目文档里提取信息。
- 不确定的关系标成 `inferred relationship`。
- 没有测试就写“暂无测试信息”，不要伪造覆盖率。
- 没有发现继承关系就留空，不为了图好看硬画。

仓库里带了一个数据校验脚本：

```bash
node scripts/validate-template-data.js <output>/template-data.js
```

它会检查 `template-data.js` 的结构、导航目标、图关系和测试用例格式。真实项目输出里如果还残留模板示例数据，也会被拦下来。

检查模板自带示例数据时使用：

```bash
node scripts/validate-template-data.js assets/code-explainer-template/template-data.js --allow-demo
```

## 目录结构

```text
visual-code-explainer/
├── SKILL.md
├── scan-policy.yaml
├── agents/
│   └── openai.yaml
├── assets/
│   ├── code-explainer-template/
│   │   ├── index.html
│   │   ├── styles.css
│   │   ├── app.js
│   │   └── template-data.js
│   └── reference/
│       └── frontend-page-sample.png
└── scripts/
    └── validate-template-data.js
```

## 本地检查

改完 skill 或模板后，可以跑这些检查：

```bash
node --check assets/code-explainer-template/app.js
node --check assets/code-explainer-template/template-data.js
node --check scripts/validate-template-data.js
node scripts/validate-template-data.js assets/code-explainer-template/template-data.js --allow-demo
```

如果本机有 Codex 的 `skill-creator` 系统脚本，也可以检查 skill 元数据：

```bash
python -X utf8 C:\Users\<你的用户名>\.codex\skills\.system\skill-creator\scripts\quick_validate.py <本仓库路径>
```

## 这个项目不做什么

它不是代码审计工具，也不会保证完全理解业务语义。

它更像一个项目导览页：把可以从代码里确认的信息先整理出来，让读者更快知道从哪里开始看。真正的细节仍然需要回到源码里确认。

## 贡献方向

可以改进的地方包括：

- 更多语言和框架的识别规则。
- 更好的代码关系提取。
- 更稳定的 UML 自动布局。
- 更细的测试用例抽取。
- 更严格的数据校验。
- 更好的移动端展示。

## License

本项目使用 Apache License 2.0 开源许可证。
