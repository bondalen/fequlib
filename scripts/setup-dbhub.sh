#!/usr/bin/env bash
# Установка DBHub для MCP → docs-registry Postgres.
# Использование: ./scripts/setup-dbhub.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DBHUB_DIR="$ROOT/.cursor/dbhub"

mkdir -p "$DBHUB_DIR"
if [[ ! -f "$DBHUB_DIR/package.json" ]]; then
  cat > "$DBHUB_DIR/package.json" <<'EOF'
{
  "name": "fequlib-dbhub",
  "version": "1.0.0",
  "private": true,
  "description": "Local MCP DBHub install for feQuLib → docs-registry Postgres",
  "license": "ISC",
  "dependencies": {
    "@bytebase/dbhub": "^0.11.6"
  },
  "overrides": {
    "mariadb": "3.4.0",
    "ssh-config": "4.1.6"
  }
}
EOF
fi

echo "node_modules/" > "$DBHUB_DIR/.gitignore"
cd "$DBHUB_DIR"
npm install

if [[ ! -f "$ROOT/.cursor/mcp.json" ]]; then
  cp "$ROOT/.cursor/mcp.json.example" "$ROOT/.cursor/mcp.json"
  echo "Создан .cursor/mcp.json из example"
fi

test -f "$DBHUB_DIR/node_modules/@bytebase/dbhub/dist/index.js"
echo "✓ DBHub готов. Reload Window в Cursor, чтобы подхватить MCP."
echo "  DSN: postgresql://docs:***@10.7.0.1:5432/docs_registry (канон VPS; нужен туннель nb-win-cloud-ru)"
echo "  Fallback: см. mcp.json.example / docs-registry docker compose (optional)"
