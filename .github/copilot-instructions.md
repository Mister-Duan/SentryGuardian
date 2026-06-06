# SentryGuardian — Copilot 项目指南

GitHub Copilot 在本仓库中应遵循的项目级指令。与 `AGENTS.md`、`.cursor/rules/` 保持一致。

## 项目说明

- **SentryGuardian**：轻量级前端监控成套系统，面向个人与小企业低成本部署，见 `docs/overview.md`
- **开发标准**：开源高标准——测试、文档、Conventional Commits、安全与可审查性，见 `docs/ai-guide/open-source.md`
- 在本仓库内独立实现，不 fork、不 vendoring Sentry 业务代码

## 编码原则

1. 最小改动，匹配现有风格
2. 公开 API：用途/作用 + 双语 JSDoc；**函数** Input/Output `@example`；**类型每个字段**用途说明；改函数/字段须同步更新（见 `docs/ai-guide/doc-comments.md`）
3. 行为变更须测试；公开 API 须文档；用户可见变更须 CHANGELOG
4. 任务结束前跑通相关 test / lint / typecheck
5. **全链路对齐**：监控改动须分析 `packages/`、`apps/`、`examples/`（采集→存储→分析→展示），见 `docs/ai-guide/data-pipeline-checklist.md`
6. 执行 MVP 计划步骤时，更新 `docs/plans/mvp-implementation.md` 后再汇报

## 禁止事项

- 未经要求 commit / push / 创建 PR
- 提交密钥、`.env` 等敏感信息
- 全仓无关重构
- 省略测试、文档或全链路分析

## Git 提交（AI）

- 仅用户明确要求时 commit；遵循 Conventional Commits
- message 末尾仅追加：`Co-authored-by: duan <blockchain07@163.com>`
- 禁止 `Co-authored-by: Cursor <cursoragent@cursor.com>`
