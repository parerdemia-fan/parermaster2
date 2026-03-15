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

## 画像アセット管理

- `public/data/images/` に画像を追加・差し替えしたら `docs/image-assets.md` の該当行の「状態」列を更新する（done / wip / —）

## 注意事項

- `public/data/` のJSONファイル（talents.json, questions.json, awards.json）は `pnpm sync` で生成される成果物。直接編集せず、生成元（`scripts/sync-spreadsheet.ts` またはスプレッドシート）を修正する
- データ設計を変更する際は、既存データの使われ方を全パターン確認してから設計する（「統一」「簡略化」で用途を潰さない）
- 前作（`../parermaster/`）の構成を参考にできる場合は先に確認し、合理的なら踏襲する
