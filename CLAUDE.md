# パレ学マスター 2nd Season

Webクイズゲーム。React 19 + TypeScript + Vite 8 + Tailwind CSS v4.2 + Zustand + GSAP。パッケージ管理は pnpm。

## 仕様書

- `docs/specification.md` をエントリポイントとする仕様書群に従って開発する
- 仕様に疑問が生じた場合はユーザー（プロデューサー）に確認する
- 実装によって仕様に追記すべき事項があれば `docs/` を更新する

## 開発原則

- DRY（Don't Repeat Yourself）
- YAGNI（You Aren't Gonna Need It）
- TypeScriptの一般的なコーディング規約に従う
- SOLID、関心の分離等の一般的なプログラミング原則

## テスト

- ロジック部分にはテストを書く（Vitest）
- UIコンポーネントのテストは必須ではない

## コマンド

- `pnpm sync` — スプレッドシートからデータ同期

## ディレクトリ構成

`docs/architecture.md` に定義された構成に従う。

## データ

- `public/data/` — JSONデータ
- `public/data/images/` — 画像リソース
