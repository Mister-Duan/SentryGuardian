#!/usr/bin/env bash
# Full local dev: SDK package watch + dsn + monitor + frontend (hot reload).
# 完整本地开发：SDK 包监听构建 + 三个应用热重启。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — run: cp .env.example .env" >&2
  exit 1
fi

echo "Building workspace packages once… / 先构建一次 workspace 包…"
pnpm --filter @sentry-guardian/browser... run build

cleanup() {
  local pids
  pids=$(jobs -p 2>/dev/null || true)
  if [[ -n "$pids" ]]; then
    kill $pids 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

pnpm run dev:packages &
pnpm run dev &
wait
