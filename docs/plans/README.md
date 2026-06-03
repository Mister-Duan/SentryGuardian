# 实施计划

SentryGuardian MVP 的分步实施文档。架构背景见 [architecture.md](../architecture.md)。

## 文件

| 文档 | 说明 |
|------|------|
| [mvp-implementation.md](./mvp-implementation.md) | **主清单**：步骤 checkbox、当前步骤、变更日志 |
| [decisions.md](./decisions.md) | 架构决策记录（ADR） |

## 如何阅读进度

1. 打开 [mvp-implementation.md](./mvp-implementation.md) 查看 `当前步骤` 与已勾选步骤。
2. 每步完成后会更新 checkbox 与「变更日志」。
3. 默认每步 diff 控制在 ~300 行以内，便于审阅。

## 协作节奏

- 按步骤 ID 顺序执行（如 P0-01 → P0-02 …）。
- 每步结束：代码 + 测试 + 更新本目录进度表。
