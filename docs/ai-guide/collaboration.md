# 多工具 AI 协作说明

SentryGuardian 以**开源高标准**开发，同时支持多种 AI 辅助工具，通过分层配置避免规则冲突。

## 工具与配置映射

| 工具 | 读取的配置 | 适用场景 |
|------|------------|----------|
| **Cursor** | `AGENTS.md` + `.cursor/rules/*.mdc` | 自研功能、文档、调试 |
| **Claude Code** | `CLAUDE.md` → `AGENTS.md` | 终端/IDE 内 Agent 任务 |
| **GitHub Copilot** | `.github/copilot-instructions.md` | 补全、Chat |

## 开源标准（全员遵守）

所有 AI 工具在本仓库产出代码时，须满足：

1. **交付三件套**：审核 diff → 测试跑通 → 文档/CHANGELOG 同步（[delivery-checklist.md](./delivery-checklist.md)）
2. **MVP 进度**：每步完成后更新 [plans/mvp-implementation.md](../plans/mvp-implementation.md)
3. **开源质量**：见 [open-source.md](./open-source.md)；公开 API 双语 JSDoc，函数含 Input/Output 示例，见 [doc-comments.md](./doc-comments.md)
4. **提交规范**：Conventional Commits（[git-commit.mdc](../../.cursor/rules/git-commit.mdc)）

**不得以用户未明确要求为由跳过测试或文档。**

## 职责分工

### Cursor（主开发）

- 实现功能并完整走完交付闭环
- 维护协作规范与项目文档

### GitHub Copilot

- 行内补全与小段建议
- Chat 时加载 `copilot-instructions.md`

### 人工开发者

- 确认 AI 产出是否符合开源质量与产品预期
- 执行 git commit / PR（或对 AI 明确授权后由其提交）

## 规则优先级

1. 用户当前对话中的明确指令
2. Team / 组织级规则（若有）
3. 开源交付标准（`open-source-standards.mdc`、`delivery-checklist.mdc`）
4. `AGENTS.md` / `.cursor/rules/project-core.mdc`
5. `git-commit.mdc`

**冲突处理**：用户指令可调整范围，但**不可默认降低**测试、文档、安全等开源底线，除非用户明确豁免。

## 同步维护 checklist

新增或变更协作规范时，检查以下文件是否需同步：

- [ ] `AGENTS.md`
- [ ] `.github/copilot-instructions.md`
- [ ] `.cursor/rules/` 相关 `.mdc`
- [ ] `docs/ai-guide/open-source.md`
- [ ] `docs/ai-guide/delivery-checklist.md`
