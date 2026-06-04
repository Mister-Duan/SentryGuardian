# @sentry-guardian/database

Prisma schema、迁移与种子数据（PostgreSQL）。

## 环境变量

见根目录 [.env.example](../../../../.env.example) 与 [docs/configuration.md](../../../../docs/configuration.md)。

## 本地数据库

```bash
# 根目录
docker compose -f docker/compose.yml up -d postgres

cd apps/backend/libs/database
pnpm db:migrate:dev   # 或 pnpm db:migrate（CI/生产）
pnpm db:seed
```

## 表概览

| 表 | 用途 |
|----|------|
| `organizations` | 控制台组织 |
| `users` | 控制台用户 |
| `projects` | 项目 + DSN public key |
| `issues` | 聚合 Issue |
| `events` | 原始 ErrorEvent（JSONB） |
