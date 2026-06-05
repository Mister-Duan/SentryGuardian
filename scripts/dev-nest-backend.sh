#!/usr/bin/env bash
# Nest backend dev: tsc watch + Node restart on dist / workspace package changes.
# Nest 后端开发：tsc 监听编译，dist 或 workspace 包变更时由 Node 热重启。
#
# Run from apps/backend/dsn or apps/backend/monitor (see package.json "dev").
# 须在 backend 应用目录下执行（由 package.json 的 dev 脚本调用）。
set -euo pipefail

APP_DIR="$(pwd -P)"
ROOT="$(cd "$APP_DIR/../../.." && pwd)"
ENV_FILE="${ROOT}/.env"
ENTRY="${1:-dist/main.js}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE}. Run from repo root: cp .env.example .env" >&2
  exit 1
fi

WATCH_PATHS=(--watch-path=dist)
PKG_ROOT="${ROOT}/packages"
if [[ -d "$PKG_ROOT" ]]; then
  for pkg_dir in "$PKG_ROOT"/*/dist; do
    [[ -d "$pkg_dir" ]] && WATCH_PATHS+=(--watch-path="$pkg_dir")
  done
fi
for lib_dir in "${ROOT}/apps/backend/libs"/*/dist; do
  [[ -d "$lib_dir" ]] && WATCH_PATHS+=(--watch-path="$lib_dir")
done

tsc -p tsconfig.json
tsc -p tsconfig.json -w --preserveWatchOutput &
TSC_PID=$!

cleanup() {
  kill "$TSC_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

exec node --watch "${WATCH_PATHS[@]}" --env-file="$ENV_FILE" "$ENTRY"
