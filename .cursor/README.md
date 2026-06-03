# Cursor 配置说明

本目录为 **Cursor IDE** 的项目级 AI 规则。

## 文件结构

```text
.cursor/
├── README.md                    # 本说明
└── rules/                       # Project Rules（.mdc）
    ├── project-core.mdc         # 始终生效：项目定位与工作流
    ├── open-source-standards.mdc # 始终生效：开源高标准
    ├── delivery-checklist.mdc   # 始终生效：代码交付闭环
    └── git-commit.mdc           # 始终生效：提交与 Conventional Commits
```

## 与其他 AI 配置的关系

| 位置 | 工具 | 用途 |
|------|------|------|
| `AGENTS.md` / `CLAUDE.md` | Cursor、Claude Code | 项目级入口指令 |
| `.cursor/rules/` | Cursor | 始终应用的细粒度规则 |
| `.github/copilot-instructions.md` | GitHub Copilot | Copilot 项目指南 |
| `docs/ai-guide/open-source.md` | 全员 | 开源标准详细说明 |
| `docs/ai-guide/doc-comments.md` | 全员 | 代码文档注释（中英文双语） |
| `docs/ai-guide/delivery-checklist.md` | 全员 | 交付检查清单 |

规则冲突时：**用户明确指令 > Team Rules > Project Rules（本目录）**；开源交付标准默认不可降级。
