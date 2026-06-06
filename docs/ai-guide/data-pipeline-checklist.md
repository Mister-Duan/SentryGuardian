# 全链路对齐检查清单（强制）

> **与交付三件套并列**：任何涉及监控**数据形态、采集能力、聚合统计或控制台展示**的代码改动，任务完成前必须执行本清单。  
> 目标：每次改动都分析 **`packages/` · `apps/` · `examples/`** 是否需要同步，把 **采集 → 接收/存储 → 分析 → 展示** 打通。  
> 用户数据流说明见 [learn/data-flow.md](../learn/data-flow.md)；包职责见 [packages.md](../packages.md)。

## 总流程（并入交付闭环）

```text
改动前：分析影响链路 + 基线测试
    ↓
改动中：小步实现（从协议/types 向内或向外扩散）
    ↓
改动后：
    ① 审核 diff
    ② 测试跑通
    ③ 文档 / CHANGELOG
    ④ 全链路对齐（本清单）← 含 examples 是否可 E2E 验证
    ↓
完成（用户明确要求时再 commit）
```

**不得以「用户只改了 UI / 只改了 SDK」为由跳过其他层**——须至少**分析**并说明「无需改动」或**补齐**缺口。

## 四层链路

```text
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│ ① 采集       │───▶│ ② 接收/存储   │───▶│ ③ 分析       │───▶│ ④ 展示       │
│ packages/   │    │ apps/backend │    │ apps/backend│    │ apps/frontend│
│ examples/   │    │ + database   │    │ /monitor    │    │ /monitor     │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
```

| 层 | 目录 / 模块 | 职责 | 典型产物 |
|----|-------------|------|----------|
| **① 采集** | `packages/types` `core` `browser` `vue` | 事件/事务协议、SDK API、Integration 上报 | `ErrorEvent`、`TransactionEvent`、`captureTransaction`、integrations |
| **① 验证** | `examples/vanilla` `examples/vue-vite` `examples/shared` | 可运行的 init、演示按钮、mock 接口 | `error-demos.js`、`performance-demos.js`、`vite-mock-api.js` |
| **② 接收/存储** | `apps/backend/dsn` `apps/backend/monitor`（ingest 路径）`database` Prisma | Envelope 解析、校验、入库、Issue 聚合字段 | `EnvelopeService`、`GrouperService`、migrations |
| **③ 分析** | `apps/backend/monitor` stats/issues/alerter | 列表筛选、分桶、聚合 API、告警规则 | `stats.service`、`performance.logic`、`issues.logic` |
| **④ 展示** | `apps/frontend/monitor` | 页面、图表、筛选、REST 客户端 | `IssuesPage`、`PerformancePage`、`api.ts`、chart 组件 |

**横切**：`packages/types` 中的 API DTO / 查询参数须与 ③④ 同步；`docs/configuration.md`、`docs/learn/console-guide.md`、`docs/learn/sdk-guide.md` 面向用户说明。

## 改动影响矩阵

实现或评审时，先定位「动的是哪一层」，再查下表**向下游 + 向 examples 扩散**。

| 你改动了… | 通常还需检查 / 更新… |
|-----------|----------------------|
| SDK 新 Integration / 新上报字段 | `types` 载荷 → dsn 入库是否保留字段 → grouper 是否需 Issue 维度 → stats 是否可聚合 → 控制台是否展示 → **examples 启用集成 + 演示按钮** |
| `TransactionEvent` / 性能指标 | 同上 + `performance.logic` + `PerformancePage` / 图表 + `sdk-guide` 性能节 + **examples 性能演示** |
| `ErrorEvent` / 错误 taxonomy | `issues` 表字段 / migration 回填 → `issues.logic` 筛选 → 错误分布 API → Issue 列表/详情 UI → **examples 错误演示** |
| Prisma schema / migration | ingest 写入路径 → grouper 映射 → 列表/详情/统计查询 → 必要时 backfill migration |
| 统计 / 列表 API（query、response） | `types` DTO → service 逻辑 → controller → `frontend` `api.ts` → 页面筛选/图表 → `configuration.md` API 表 |
| 控制台页面 / 图表 / 筛选 | 对应 backend 是否已有 query；若无则补 ③；**examples 能否产生该维度数据** |
| 仅 examples 演示 | 确认 SDK 已 init 对应 integration；mock 路由在 `shared/vite-mock-api.js`；README 与 `examples/README.md` |
| 仅文档 / 纯 refactor（行为不变） | 在审核结论写明「全链路无行为变更，跳过 ④」 |

## 按能力域的 E2E 对照

新增或扩展某一监控能力时，用下表自检 **examples → 控制台** 是否闭环。

| 能力域 | ① 采集 / examples | ② 存储 | ③ 分析 API | ④ 控制台 |
|--------|-------------------|--------|------------|----------|
| **错误** | `error-demos.js`、默认 integrations | `events` + grouper → `issues` | `issues` 列表筛选、`error-breakdown`、`error-type-trends` | Issues 页、筛选 pill、概览图 |
| **性能** | `example-performance.js`、`performance-demos.js`、`/mock/slow` | `events`（`TRANSACTION`） | `performance-summary`、`transactions` | 性能页、Vital 卡片、趋势图 |
| **Release / Source Map** | SDK `release` 字段 | `releases` + artifacts | symbolicator | Issue 详情堆栈 |
| **告警** | 触发新 Issue / 错误率 | `alert_rules` | alerter 维护任务 | 告警页 |

缺任一列须在任务汇报中列为**已知限制**或**本次补齐**。

## AI 执行步骤（每次代码改动）

### 1. 改动前（30 秒～2 分钟）

- 用一句话标注：`[采集|存储|分析|展示]` 主要动层
- 列出可能波及的目录（至少扫一眼 `packages/types`、`apps/backend/monitor`、`apps/frontend/monitor`、`examples/`）

### 2. 改动后（必须产出）

在对话中附 **全链路结论**（可与审核结论合并）：

```text
全链路对齐：
- 采集（packages/examples）：… / 无需改动
- 存储（dsn/grouper/DB）：… / 无需改动
- 分析（stats/issues API）：… / 无需改动
- 展示（frontend/docs）：… / 无需改动
- E2E：examples 可验证 …；控制台 … 页可见
```

### 3. 何时必须改 examples

| 场景 | 要求 |
|------|------|
| 新增 SDK integration 或推荐 init 配置 | `examples` 至少一个示例项目启用，并在演示面板或 README 说明 |
| 新增控制台指标 / 图表 / 筛选项 | examples 能**稳定产生**对应数据（按钮、mock API 或文档明确手动步骤） |
| 仅后端 / 仅 UI 内部优化 | 说明 examples 仍覆盖既有路径即可 |

### 4. 推荐本地 E2E 命令

```bash
pnpm dev                    # dsn + monitor API + 控制台
cd examples/vanilla && pnpm dev   # :5174 错误 + 性能演示
# 控制台 http://localhost:5173 → Issues / 性能
```

## 违规判定

以下视为**任务未完成**（与 [delivery-checklist.md](./delivery-checklist.md) 并列）：

- 加了控制台图表但 examples 无法产生对应数据，且未文档化替代验证步骤
- 改了 `types` 协议但 ingest 或 UI 仍按旧字段读写
- 加了 SDK 采集能力但 examples 未 init 对应 integration
- 全链路结论缺失或明显与 diff 不符

## 维护本清单时

同步更新：

- [ ] `AGENTS.md`
- [ ] `.cursor/rules/data-pipeline.mdc`
- [ ] `.cursor/rules/delivery-checklist.mdc`
- [ ] `docs/ai-guide/delivery-checklist.md`
- [ ] `docs/ai-guide/collaboration.md`
- [ ] `.github/copilot-instructions.md`
- [ ] `.cursor/README.md`
