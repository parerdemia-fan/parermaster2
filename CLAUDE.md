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
- ゲーム背景画像は `body`（`src/app/index.css`）に設定する。画面コンポーネント内に設定すると 4:3 GameContainer 外に余白が生じる
- UI のレイアウト・サイズは前作の具体的な CSS 値（cqmin 等）を起点にする。独自の値で試行錯誤せず、前作の値をまず確認してからそれをベースに調整する
- レイアウト制約（maxHeight, flex縮小等）を変更したら、子要素の `object-fit` も連動して確認する（cover→containへの変更漏れ防止）
- 双方向ナビゲーション（前へ/次へ）を追加する際は、前進・後退の両方向で状態遷移の整合性を確認する（回答済み問題に進んだときの quizState 等）
- 画像アセットを使う実装では、世代（1期生/2期生）ごとにアセットの有無とパスを確認する。存在しない場合のフォールバックも実装する
- 選択肢やタブの並び順は自然な順序（1期生→2期生、小→大等）にする。デフォルト選択を先頭に持ってくる必要はない
- 実装プランに仕様書更新のステップが含まれる場合は、コード実装より先に `docs/` を更新する。仕様とコードの乖離を防ぎ、プロデューサーの確認機会を確保する
- Zustand の setter は内部で `localStorage` 書き込み等の副作用を伴う場合がある。レンダー中（コンポーネント本体）から呼ばず、必ずイベントハンドラや `useEffect` 内で呼ぶ
- 新しい関数やハンドラーを追加する際、引数・戻り値に使う型が現ファイルでインポート済みか確認してからコードを書く（`pnpm build` 前に目視チェック）
