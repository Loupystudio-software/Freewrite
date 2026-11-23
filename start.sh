#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "==================================================="
echo "              Starting Freewrite                   "
echo "    (Collab Server :1234 + Web Editor :5173)       "
echo "==================================================="

if [ ! -d "node_modules" ]; then
    echo "[Setup] Installing dependencies..."
    pnpm install
fi

if [ ! -d "packages/core/dist" ]; then
    echo "[Build] Building core package..."
    pnpm --filter @freewrite/core build
fi

# Attempt to open browser in background
(sleep 3 && (open http://localhost:5173 || xdg-open http://localhost:5173 || true)) &

echo "[Running] Starting Hocuspocus Server and Web Client..."
pnpm start
