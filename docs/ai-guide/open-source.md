# 开源开发标准

SentryGuardian 以**开源项目的高标准**建设：代码、文档、测试、安全与协作流程均按「对外公开、社区可参与」的要求执行。AI 辅助开发须遵守本规范及 `.cursor/rules/` 中的强制规则。

## 原则

| 原则 | 说明 |
|------|------|
| **透明** | 架构决策、API 设计、Breaking Change 写入文档，可追溯 |
| **可贡献** | 目录清晰、本地可构建、CONTRIBUTING 可跟随（随项目补充） |
| **可信赖** | 测试覆盖核心路径；CI 门禁；安全与依赖审慎 |
| **可长期维护** | 小步迭代、Conventional Commits、语义化版本 |
| **对使用者友好** | 文档完整、示例可跑、部署步骤明确 |

## 代码质量

### 通用

- 遵循仓库既有风格；新代码与周边文件一致
- 函数与模块职责单一；公开接口与内部实现分离
- 错误处理明确，不吞异常；日志可排查但不含敏感信息
- 禁止提交：`console.log` 调试残留、大段注释掉的代码、硬编码密钥

### 测试

- **核心逻辑必须有测试**：Issue 指纹、事件解析、聚合规则、SDK 上报格式等
- 测试命名表达行为意图；优先单元测试，集成测试覆盖关键链路
- 修复 Bug 时先写失败用例（Red → Green），再提交修复

### 静态检查

- 启用 lint、format、typecheck、spellcheck（具体工具随技术栈在 `package.json` 定义）
- 文档拼写：`pnpm spellcheck`（[cspell](https://cspell.org/)，配置见 `.cspell/`；`awesome/` 参考代码已排除）
- CI 中与本地使用相同命令，避免「本地过、CI 挂」
- AI 任务结束前跑通**与改动相关**的检查，不全仓盲目 `--fix`

## 文档

### 必须维护的文档（随实现逐步补齐）

| 文档 | 用途 |
|------|------|
| `README.md` | 项目介绍、快速开始 |
| `CONTRIBUTING.md` | 贡献流程、分支与 PR 规范 |
| `CHANGELOG.md` | 版本变更记录 |
| `LICENSE` | 开源许可证 |
| `docs/` | 架构、部署、API 详细说明 |
| 各包 `README.md` | SDK / 服务 / 控制台独立说明 |

### 文档同步规则

- 修改公开 API、配置、CLI 参数 → **同一 PR / 任务内**更新对应文档
- 新增环境变量 → 提供 `.env.example` 与说明
- 用户可见行为变更 → 更新 `CHANGELOG.md` Unreleased 小节

## Git 与版本

### Conventional Commits

```text
feat(sdk): add unhandledrejection capture
fix(server): correct issue fingerprint for minified stacks
docs: update docker compose guide
test(api): cover rate limit on ingest
chore: bump eslint to 9.x
```

- `feat` / `fix` 影响版本号（SemVer）
- `BREAKING CHANGE:` 放在 commit body 或类型后 `!`（如 `feat(api)!:`）

### 分支与 PR（规划）

- `main` 保持可发布状态
- 功能分支：`feat/xxx`、`fix/xxx`
- PR 描述含：背景、变更摘要、测试方式、相关 Issue

## 安全

- **永不提交**：API Key、DSN Secret、数据库密码、私钥
- 上报接口须鉴权与限流；控制台须认证（随实现）
- 依赖升级关注 CVE；生产镜像定期重建
- 安全漏洞遵循 `SECURITY.md` 负责任披露流程（随项目补充）

## 依赖与许可证

- 本项目采用开源许可证（具体以根目录 `LICENSE` 为准）
- 引入依赖检查许可证兼容性，避免 GPL 等与项目许可证冲突的传染条款（除非刻意选型）
- 优先轻量、活跃维护的库，符合「低成本部署」目标

## SDK 与公开 API

- semver：MAJOR 仅在不兼容变更时递增
- 废弃 API：先 `@deprecated` + 文档 + CHANGELOG，至少保留一个 MINOR 再移除
- 配置项须有类型、默认值与示例
- 浏览器 SDK 注意体积与 tree-shaking
- **文档注释**：双语 JSDoc；**函数**须含 Input/Output `@example`，见 [doc-comments.md](./doc-comments.md)

## UI / 控制台（适用时）

- 基础可访问性：语义化 HTML、键盘可操作、对比度合理
- 错误态、空态、加载态完整
- 用户可见文案清晰；i18n 架构预留（若首期中文，结构勿写死）

## AI 协作专属要求

AI 在本仓库开发时，除一般开源规范外还须：

1. **交付闭环**：每次代码改动完成 [delivery-checklist.md](./delivery-checklist.md) 三件套
2. **不降低标准**：不因「用户未提」而省略测试或文档
3. **PR 思维**：单次改动宜小、可审查、附验证说明
4. **规范同步**：变更协作流程时同步 `AGENTS.md`、`.cursor/rules/`、本文件
5. **双语文档注释**：公开 API 的 JSDoc/TSDoc 须中英文并存，见 [doc-comments.md](./doc-comments.md)

## 相关文档

- [doc-comments.md](./doc-comments.md) — 代码文档注释（中英文双语）
- [delivery-checklist.md](./delivery-checklist.md) — 强制交付检查清单
- [collaboration.md](./collaboration.md) — 多工具协作
- [../AGENTS.md](../AGENTS.md) — AI 入口
