# SentryGuardian — AI 协作规范

本仓库为 **轻量级前端监控成套系统**，以**开源项目的高标准**开发与交付。AI 助手请先阅读本文件、[docs/overview.md](./docs/overview.md) 与 [docs/ai-guide/open-source.md](./docs/ai-guide/open-source.md)，再开始实现。

## 项目概览

- **定位**：前端监控成套方案——SDK 埋点、数据接收、Issue 聚合、控制台、告警；借鉴 Sentry 设计，**独立自研**
- **目标用户**：个人开发者、小型团队、小企业（前端为主、预算有限、需自托管）
- **部署目标**：单机 / Docker 低成本运行，依赖精简，无按量 SaaS 费用
- **开发标准**：开源高质量——可测试、可文档化、可审查、Conventional Commits、SemVer
- **当前阶段**：初始化；业务代码待落地，协作规范与文档已就绪
- **本仓库追踪内容**：SentryGuardian 自研代码、文档、AI 协作配置

## 强制交付闭环

任何**代码改动**任务完成前必须执行（不可因用户未提及而跳过）：

```text
分析 → 基线测试 → 实施 → ① 审核 diff → ② 测试跑通 → ③ 文档/CHANGELOG 同步 → 完成
```

细则见 [docs/ai-guide/delivery-checklist.md](./docs/ai-guide/delivery-checklist.md) 与 `.cursor/rules/delivery-checklist.mdc`。

## 工作区边界

```text
SentryGuardian/
├── AGENTS.md              # 本文件：项目级 AI 入口
├── docs/                  # 项目文档（overview、ai-guide）
├── .cursor/rules/         # Cursor 细粒度规则
├── .github/               # Copilot 指令
├── CHANGELOG.md           # 版本变更（随发布补充）
└── packages/ …            # 自研业务代码（随实现补充）
```

## 编码原则

1. **最小改动**：只改与任务相关的文件，不顺手重构无关代码
2. **匹配现有风格**：命名、import、测试写法与周边文件一致
3. **借鉴不复制**：参考 Sentry 的前端监控与 Issue 设计，在本仓库做轻量、独立的成套实现
4. **成本意识**：架构与依赖选择优先考虑个人 / 小企业单机部署，避免引入不必要的重型组件
5. **开源质量**：行为变更必测、公开 API 必文档、用户可见变更必 CHANGELOG
6. **不 over-engineer**：避免为单行逻辑抽 helper、过度抽象
7. **注释**：公开 API 须**中英文双语文档注释**（见 `docs/ai-guide/doc-comments.md`）；行内注释仅解释非显而易见逻辑，建议同样双语

## 禁止事项

- 未经要求执行 `git commit` / `git push` / 创建 PR
- 提交 `.env`、密钥、token 等敏感信息
- 修改 git config；对 `main`/`master` force push
- 将 Sentry 上游代码直接 vendoring 进本仓库
- 一次性大规模重写（渐进式改动，保持可运行）
- **以用户未要求为由省略测试、文档或 CHANGELOG**

## 文档索引

| 文档 | 说明 |
|------|------|
| [docs/overview.md](./docs/overview.md) | 项目简介与设计原则 |
| [docs/ai-guide/doc-comments.md](./docs/ai-guide/doc-comments.md) | 代码文档注释（中英文双语） |
| [docs/ai-guide/open-source.md](./docs/ai-guide/open-source.md) | 开源开发标准 |
| [docs/ai-guide/delivery-checklist.md](./docs/ai-guide/delivery-checklist.md) | 强制交付检查清单 |
| [docs/README.md](./docs/README.md) | 文档索引 |
| [AGENTS.md](./AGENTS.md) | 本文件：项目级入口 |
| [.cursor/README.md](./.cursor/README.md) | Cursor 规则说明 |
| [.cursor/rules/](./.cursor/rules/) | 细粒度 Project Rules |
| [.github/copilot-instructions.md](./.github/copilot-instructions.md) | GitHub Copilot 指令 |
| [docs/ai-guide/collaboration.md](./docs/ai-guide/collaboration.md) | 多工具协作说明 |

## Git 提交（AI）

- 仅用户明确要求时 commit；遵循 **Conventional Commits**
- message 末尾**仅**追加 `Co-authored-by: duan <blockchain07@163.com>`
- **禁止** `Co-authored-by: Cursor <cursoragent@cursor.com>`；若 amend 仍被注入，用 `git commit-tree` 重写（见规则）
- 细则见 [.cursor/rules/git-commit.mdc](./.cursor/rules/git-commit.mdc)
