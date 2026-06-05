# 实施计划

SentryGuardian MVP 的分步实施文档。架构背景见 [architecture.md](../architecture.md)。

## 文件

| 文档 | 说明 |
|------|------|
| [mvp-implementation.md](./mvp-implementation.md) | **MVP 主清单**（Phase 0～11） |
| [post-mvp-roadmap.md](./post-mvp-roadmap.md) | **Post-MVP 路线图**（Phase 12～21，告警置后） |
| [decisions.md](./decisions.md) | 架构决策记录（ADR） |
| [../packages.md](../packages.md) | 已实现 npm 包 |
| [../development.md](../development.md) | 本地构建与测试命令 |

## 如何阅读进度

1. 打开 [mvp-implementation.md](./mvp-implementation.md) 查看 `当前步骤` 与已勾选步骤。
2. 每步完成后会更新 checkbox 与「变更日志」。

## 协作节奏（强制）

按步骤 ID 顺序执行（如 P0-01 → P0-02 …）。**每步结束必须完成：**

```text
代码 + 测试通过 → 更新 mvp-implementation.md → 再汇报用户
```

更新细则见 [mvp-implementation.md §维护规则](./mvp-implementation.md#维护规则强制)。

默认每步 diff 控制在 ~300 行以内，便于审阅。

## AI 协作

执行 MVP 计划任务时，须将「更新 `mvp-implementation.md`」纳入交付闭环，与 [delivery-checklist.md](../ai-guide/delivery-checklist.md) 同等优先级。
