#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# 設定ファイルの確認
if [ ! -f "$SCRIPT_DIR/sync-config.json" ]; then
  echo "エラー: scripts/sync-config.json が見つかりません"
  echo ""
  echo "セットアップ手順:"
  echo "  1. cp scripts/sync-config.example.json scripts/sync-config.json"
  echo "  2. sync-config.json にスプレッドシートIDとサービスアカウント鍵のパスを設定"
  echo "  3. Google Cloud でサービスアカウントを作成し、鍵JSONを secrets/ に配置"
  echo "  4. スプレッドシートをサービスアカウントのメールアドレスに共有（閲覧者）"
  exit 1
fi

# 依存パッケージの確認
if [ ! -d "node_modules" ]; then
  echo "依存パッケージをインストール中..."
  pnpm install
fi

# 実行
pnpm tsx scripts/sync-spreadsheet.ts "$@"
