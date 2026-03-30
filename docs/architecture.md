# 技術構成

[メイン仕様書](specification.md) > 技術構成

---

## 1. アーキテクチャ概要
- SPA（Single Page Application）
- 静的サイトホスティング（GitHub Pages）
- サーバーレス（バックエンドなし）

---

## 2. フロントエンド

| 項目 | 前作 | 2nd Season | 備考 |
|------|------|-----------|------|
| UIフレームワーク | React 19.2 | React 19.2 | 踏襲 |
| 言語 | TypeScript 5.9 | TypeScript 5.9 | 踏襲 |
| ビルドツール | Vite 7 | **Vite 8** | メジャーアップデート |
| スタイリング | Tailwind CSS v4.1 | **Tailwind CSS v4.2** | マイナーアップデート |
| 状態管理 | Zustand 5.0 | Zustand 5.0 | 踏襲 |
| アニメーション | GSAP 3.14 | GSAP 3.14 | 踏襲 |
| テスト | Vitest 4.0 | **Vitest 4.1** | マイナーアップデート |
| リンター | ESLint 9 | **ESLint 10** | メジャーアップデート |
| パッケージ管理 | pnpm | pnpm | 踏襲 |

※ 開発開始時点の最新安定版を使用する。互換性に問題があれば前作のバージョンにフォールバック。

---

## 3. データストレージ
- タレントデータ: `public/data/talents.json`
- 問題データ: `public/data/questions.json`
- イベント実績: `public/data/awards.json`
- プレイヤー進捗: LocalStorage
- 詳細は [data-design.md](data-design.md) を参照

---

## 4. インフラ・ホスティング
- GitHub Pages
- GitHub Actions（CI/CD）

---

## 5. 外部サービス連携
- X（Twitter）シェア機能（結果画面・タイムアタック）

---

## 6. アーキテクチャ改善方針

前作からの大部分を踏襲しつつ、以下の構造的問題を改善する。

### 前作の構造的問題

| 問題 | 前作の状況 | 影響 |
|------|-----------|------|
| 巨大ストア | gameStore.ts が1330行の単一ファイル | 変更が困難、テストしにくい |
| 巨大コンポーネント | QuizScreen.tsx が1660行 | 問題タイプ追加のたびに肥大化 |
| ハードコードされた問題タイプ | switch文で `'face'` / `'name'` / `'normal'` を分岐 | 新しい問題タイプの追加に既存コード修正が必要 |
| ハードコードされたカテゴリ | SettingScreenに各ステージのカテゴリが直書き | ゲームモード変更のたびにUI修正 |
| ハードコードされたアチーブメント | 26個のアチーブメントがストア内にべた書き | 追加・変更が困難 |

### 改善: 問題タイプのディレクトリ分離

問題タイプをディレクトリ単位で分離し、追加・変更を容易にする。

> **検討の結果不採用とした構想:**
> - **プラグインレジストリシステム**（registry.ts + registerQuestionType）: 問題タイプが最大8つで爆発的に増えないこと、各レイアウトのpropsが微妙に異なること（TextQuizLayoutのrestoredSelectedIndex等）から、統一インターフェースに押し込む複雑さに見合わない。QuizScreen.tsx での typeId 分岐で十分。
> - **QuizLayout.tsx への共通レイアウト分離**: QuizScreen.tsx が148行と小さく、フッターに問題タイプ固有ロジック（知識クイズの「戻る」ボタン等）が含まれるため、分離のメリットが薄い。

**ディレクトリ構成:**
```
src/
├── app/                         # アプリケーション層
│   ├── App.tsx
│   ├── main.tsx
│   └── routes/                  # 画面コンポーネント
│       ├── TitleScreen.tsx
│       ├── SettingScreen.tsx
│       ├── QuizScreen.tsx       # ヘッダー・フッター・typeId分岐を直接管理
│       ├── ResultScreen.tsx
│       ├── TalentListScreen.tsx # タレント一覧+詳細（1画面で左右分割）
│       ├── AchievementScreen.tsx
│       ├── DiaryScreen.tsx
│       ├── TimeAttackResultScreen.tsx  # タイムアタック結果画面
│       ├── AboutScreen.tsx             # 案内画面
│       ├── DebugScreen.tsx            # デバッグ画面（DEV環境のみ）
│       └── OgpScreen.tsx              # OGP画像生成（DEV環境のみ）
│
├── features/                    # 機能単位のモジュール
│   ├── quiz/                    # クイズ共通ロジック
│   │   └── types.ts             # BaseQuestion, AnswerRecord
│   │
│   ├── question-types/          # 各問題タイプが独立ディレクトリ
│   │   ├── face-guess/          # 問題タイプ1: 顔当て
│   │   │   ├── FaceGuessLayout.tsx
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── name-guess/          # 問題タイプ2: 名前当て
│   │   │   ├── NameGuessLayout.tsx
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── name-build/          # 問題タイプ3: 名前を作ろう
│   │   │   ├── NameBuildLayout.tsx
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── text-quiz/           # 問題タイプ4: テキストクイズ
│   │   │   ├── TextQuizLayout.tsx
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── blur/                # 問題タイプ5: ぼかし（タイムアタック専用）
│   │   │   ├── BlurLayout.tsx
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── spotlight/           # 問題タイプ6: スポットライト（タイムアタック専用）
│   │   │   ├── SpotlightLayout.tsx
│   │   │   ├── generator.ts
│   │   │   └── types.ts
│   │   │
│   │   └── word-search/         # 問題タイプ7: 名前はどこ？（タイムアタック専用）
│   │       ├── WordSearchLayout.tsx
│   │       ├── generator.ts
│   │       └── types.ts
│   │
│   ├── achievement/             # アチーブメント（バッジ）
│   │   ├── types.ts             # BadgeRank, BadgeSlotId
│   │   ├── constants.ts         # スロット定義, ランク関連ユーティリティ
│   │   └── judge.ts             # バッジ獲得判定（純粋関数）
│   │
│   ├── time-attack/             # タイムアタックモード
│   │   ├── constants.ts         # 出題構成定義, タイム別メッセージ
│   │   └── generator.ts         # 100問生成
│   │
│   └── room/                    # 談話室（縦画面下部）
│       ├── RoomArea.tsx          # メインコンテナ
│       ├── TalentSlot.tsx        # 立ち絵スロット + GSAPアニメーション
│       ├── TalentSelector.tsx    # タレント選択UI
│       └── useRoomStore.ts       # Zustandストア
│
├── stores/                      # Zustand ストア（機能ごとに分割）
│   ├── gameStore.ts             # ゲーム進行状態
│   ├── settingsStore.ts         # 画面遷移・ゲーム設定
│   └── badgeStore.ts            # バッジ獲得状態・LocalStorage永続化
│
├── shared/                      # 共有ユーティリティ・コンポーネント
│   ├── components/
│   ├── hooks/
│   │   ├── useTalents.ts         # タレントデータ取得
│   │   ├── useQuestions.ts       # 問題データ取得
│   │   ├── useQuotes.ts          # セリフデータ取得
│   │   ├── useScreenMode.ts      # 画面比率モード判定
│   │   └── ...
│   ├── utils/
│   └── types/
```

**問題タイプの追加手順:**
1. `features/question-types/<type-name>/types.ts` — BaseQuestion を拡張した型を定義
2. `features/question-types/<type-name>/generator.ts` — 問題生成ロジック
3. `features/question-types/<type-name>/<TypeName>Layout.tsx` — 出題UI・選択状態管理・正誤判定
4. `QuizScreen.tsx` に typeId の分岐を追加

### 改善: ストアの分割

前作の1330行 gameStore を機能別に分割する。

| ストア | 責務 |
|--------|------|
| gameStore | クイズ進行状態（currentIndex, quizState, correctCount）。問題の内容や回答方法の詳細を知らない |
| settingsStore | 画面遷移・ゲーム設定・LocalStorage永続化 |
| badgeStore | バッジ・解放状態・LocalStorage永続化 |

各ストアは100〜300行程度を目安とする。

### 問題タイプの型設計と責務分離

共通層（`features/quiz/`）は問題の内容や回答方法を一切知らない。各問題タイプが型・生成・UI・正誤判定をすべて自己完結で持つ。

**型の階層:**
```
BaseQuestion（typeId, difficulty のみ）
  └─ NameGuessQuestion extends BaseQuestion（answers, correctIndex, talentImagePath 等）
  └─ FaceGuessQuestion extends BaseQuestion（...）
  └─ NameBuildQuestion extends BaseQuestion（文字グリッド等、選択肢なし）
```

**各層の責務:**

| 層 | 知っていること | 知らないこと |
|----|------------|-----------|
| BaseQuestion / AnswerRecord | typeId, difficulty / isCorrect | 選択肢、画像、正誤判定ロジック |
| gameStore | 何問目か、回答済みか、正解数 | 問題の表示方法、回答の仕組み |
| QuizScreen | typeIdによる振り分け | 各問題タイプの内部実装 |
| 各問題タイプのLayout | 自分の型の全フィールド、選択状態の管理、正誤判定 | 他の問題タイプ |

**問題タイプの追加手順:**
1. `features/question-types/<type-name>/types.ts` — BaseQuestion を拡張した型を定義
2. `features/question-types/<type-name>/generator.ts` — 問題生成ロジック
3. `features/question-types/<type-name>/<TypeName>Layout.tsx` — 出題UI・選択状態管理・正誤判定
4. `QuizScreen.tsx` に typeId の分岐を1行追加

### 改善: アチーブメントのデータ駆動化

前作のハードコードされたアチーブメントをデータ定義に置き換える。

```typescript
// features/achievement/constants.ts
export const BADGE_SLOTS: readonly BadgeSlotDef[] = [
  { id: 'gen2_all', label: '2期生', category: 'clear', maxRank: 'gold' },
  { id: 'gen2_knowledge', label: '2期生・知識クイズ', category: 'knowledge', maxRank: 'bronze' },
  // ... 計8スロット（世代別4 + 寮別4）
]
```

バッジ獲得判定は `features/achievement/judge.ts` の純粋関数で行い、結果画面から呼び出す。永続化は `stores/badgeStore.ts`（Zustand + localStorage）で管理。
