# 代码交付检查清单（强制）

> **最高优先级**：任何涉及业务代码的改动，在任务完成（含用户要求 commit 之前）必须完整执行本清单。  
> 与 [open-source.md](./open-source.md) 中的开源标准并列，**不可省略任一环节**。

## 总流程

```text
改动前：分析 + 测试基线
    ↓
改动中：小步实现 + 定向 lint
    ↓
改动后（交付三件套）：
    ① 全方位审核（本次 diff）
    ② 补全/更新测试并跑通
    ③ 同步文档与 CHANGELOG
    ↓
任务完成（用户明确要求时再 commit）
```

## ① 全方位代码审核

**范围**：仅审核本次变更的文件与直接调用链，不顺手重构无关代码。

### 审核维度

| 维度 | 检查项 |
|------|--------|
| 功能正确性 | 主路径、边界、错误处理、空数据 |
| 开源质量 | 命名清晰、无调试残留、无硬编码密钥 |
| 架构边界 | 模块职责清晰；SDK / 服务 / UI 不越层耦合 |
| 安全 | 输入校验、鉴权相关逻辑、日志不泄露敏感字段 |
| 类型与 Lint | 相关 typecheck、lint 通过 |
| 一致性 | 与同类实现、仓库既有约定对齐 |
| 依赖 | 新依赖许可证与体积可接受 |

### 审核产出（对话中简要说明）

```text
审核结论：
- 通过项：…
- 已修复：…
- 已知限制/后续：…（若有）
```

## ② 测试用例

### 最低要求

| 变更类型 | 要求 |
|----------|------|
| 新功能 | 核心逻辑 + 至少 1 个边界/失败场景 |
| Bug 修复 | 回归用例；优先先红后绿 |
| 重构 | 行为不变；测试基线保持通过 |
| 公开 API 变更 | 契约测试或快照测试更新 |
| 纯样式/UI | 关键交互可测则补测试；否则说明理由 |

### 命令

以根目录及各包 `package.json` scripts 为准，示例：

```bash
pnpm test                    # 或 npm run test
pnpm exec vitest run <文件>   # 定向单测
pnpm lint                    # lint
pnpm typecheck               # 类型检查
```

## ③ 文档与 CHANGELOG

### 何时必须写/更新

| 变更 | 文档 |
|------|------|
| SDK 公开 API | 包 `README.md` + 使用示例 |
| HTTP API / 配置项 | `docs/` 对应章节 + `.env.example` |
| 部署方式 | 部署文档、`docker-compose` 注释 |
| 用户可见行为 | `CHANGELOG.md` Unreleased |
| 架构决策 | `docs/overview.md` 或 `docs/architecture.md` |

### 何时可省略

- 纯内部 refactor 且对外行为、API 完全不变（须在审核结论中说明）
- 仅修正注释错别字且不影响语义

## 违规判定

以下情况视为**任务未完成**：

- 改了行为未跑测试或虚报通过
- 改了公开 API 未更新文档
- 用户可见变更未记 CHANGELOG
- diff 含密钥、调试代码或无关大范围格式化

## 与 Git 提交的关系

- 本清单在 **commit 之前** 完成
- Commit message 遵循 Conventional Commits，细则见 [.cursor/rules/git-commit.mdc](../../.cursor/rules/git-commit.mdc)
