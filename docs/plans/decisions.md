# 架构决策记录（ADR）

与 [architecture.md](../architecture.md) §11 Open Questions 对应。

## ADR-001：Backend 技术栈

- **状态**：已决
- **决策**：Nest.js + TypeScript
- **理由**：与 Monorepo SDK 同构；生态成熟；模块化适合 dsn / monitor 拆分

## ADR-002：控制台技术栈

- **状态**：已决
- **决策**：React + Vite + shadcn/ui + Tailwind CSS
- **理由**：shadcn 生态默认 React；Issue 列表/详情组件丰富

## ADR-003：MVP 存储

- **状态**：已决
- **决策**：Lite 档仅 PostgreSQL；Analytics / ClickHouse 暂缓
- **理由**：降低 MVP 依赖与运维成本

## ADR-004：聚合触发

- **状态**：已决
- **决策**：异步 worker + DB 轮询（`aggregated_at IS NULL`）
- **理由**：无 Redis 依赖；与 architecture §5.2 一致

## ADR-005：Envelope 格式

- **状态**：已决
- **决策**：标准 line-based `application/x-sentry-envelope`
- **理由**：与 Sentry 协议对齐，避免二次迁移

## ADR-006：API 风格

- **状态**：已决
- **决策**：REST only（MVP）
- **理由**：Issue CRUD 足够；GraphQL 延后

## ADR-007：ORM

- **状态**：已决
- **决策**：Prisma（`apps/backend/libs/database`）
- **理由**：Nest 生态常见；migration 清晰

## ADR-008：开发期进程模型

- **状态**：已决
- **决策**：目录保留 `dsn` / `monitor`；开发期可选 all-in-one Nest 应用
- **理由**：降低本地复杂度，生产仍可拆分

## 待定

| # | 议题 | 计划步骤 |
|---|------|----------|
| 5 | 符号化时机 | P1 阶段；查询时符号化 |
| 8 | CORS 默认 | P6-08；dev `*` 可配置 |
| 9 | 小程序 SDK | 不做（MVP 外） |
| 10 | 配置源 | 环境变量 + `.env.example` |
