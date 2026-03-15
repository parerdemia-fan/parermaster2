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

### 改善: プラグイン的問題タイプシステム

問題タイプをディレクトリ単位で分離し、追加・変更を容易にする。

**ディレクトリ構成:**
```
src/
├── app/                         # アプリケーション層
│   ├── App.tsx
│   ├── main.tsx
│   └── routes/                  # 画面コンポーネント
│       ├── TitleScreen.tsx
│       ├── SettingScreen.tsx
│       ├── QuizScreen.tsx       # 薄いラッパー（問題タイプに応じてプラグインを呼ぶだけ）
│       ├── ResultScreen.tsx
│       └── ...
│
├── features/                    # 機能単位のモジュール
│   ├── quiz/                    # クイズ共通ロジック
│   │   ├── types.ts             # QuestionTypePlugin インターフェース等
│   │   ├── registry.ts          # 問題タイプレジストリ
│   │   ├── QuizLayout.tsx       # 共通レイアウト（ヘッダー・フッター・進行制御）
│   │   └── hooks/
│   │       └── useQuiz.ts       # クイズ進行ロジック
│   │
│   ├── question-types/          # 各問題タイプが独立ディレクトリ
│   │   ├── face-guess/          # 問題タイプ1: 顔当て
│   │   │   ├── index.ts         # プラグイン登録（エントリポイント）
│   │   │   ├── FaceGuessLayout.tsx
│   │   │   └── generator.ts     # 問題生成ロジック
│   │   │
│   │   ├── name-guess/          # 問題タイプ2: 名前当て
│   │   │   ├── index.ts
│   │   │   ├── NameGuessLayout.tsx
│   │   │   └── generator.ts
│   │   │
│   │   ├── name-build/          # 問題タイプ3: 名前を作ろう
│   │   │   ├── index.ts
│   │   │   ├── NameBuildLayout.tsx
│   │   │   └── generator.ts
│   │   │
│   │   ├── profile-guess/       # 問題タイプ5: プロフィール→顔当て（TA専用）
│   │   │   ├── index.ts
│   │   │   ├── ProfileGuessLayout.tsx
│   │   │   └── generator.ts
│   │   │
│   │   ├── name-search/         # 問題タイプ6: 名前はどこ？（TA専用）
│   │   │   ├── index.ts
│   │   │   ├── NameSearchLayout.tsx
│   │   │   └── generator.ts
│   │   │
│   │   ├── spotlight/           # 問題タイプ7: スポットライト（TA専用）
│   │   │   ├── index.ts
│   │   │   ├── SpotlightLayout.tsx
│   │   │   └── generator.ts
│   │   │
│   │   ├── blur/                # 問題タイプ8: ぼかし（TA専用）
│   │   │   ├── index.ts
│   │   │   ├── BlurLayout.tsx
│   │   │   └── generator.ts
│   │   │
│   │   └── text-quiz/           # 問題タイプ4: テキストクイズ（通常モードでは知識クイズモードとして独立出題）
│   │       ├── index.ts
│   │       ├── TextQuizLayout.tsx
│   │       └── generator.ts
│   │
│   ├── time-attack/             # タイムアタック
│   │   ├── index.ts
│   │   ├── TimeAttackScreen.tsx
│   │   └── hooks/
│   │
│   ├── achievements/            # アチーブメント
│   │   ├── definitions.ts       # データ駆動のアチーブメント定義
│   │   ├── hooks/
│   │   └── AchievementScreen.tsx
│   │
│   └── talents/                 # タレント関連
│       ├── TalentListScreen.tsx
│       ├── TalentDetailScreen.tsx
│       └── hooks/
│
├── stores/                      # Zustand ストア（機能ごとに分割）
│   ├── gameStore.ts             # ゲーム進行状態（薄く保つ）
│   ├── settingsStore.ts         # 設定・永続化
│   └── achievementStore.ts      # アチーブメント状態
│
├── shared/                      # 共有ユーティリティ・コンポーネント
│   ├── components/
│   │   ├── ThreePatchButton.tsx
│   │   ├── Panel.tsx
│   │   └── ...
│   ├── hooks/
│   ├── utils/
│   └── types/
│
└── assets/
```

**問題タイププラグインのインターフェース:**
```typescript
interface QuestionTypePlugin {
  /** 一意な識別子 */
  id: string
  /** 表示名（設定画面用） */
  displayName: string
  /** 問題生成 */
  generate(context: GeneratorContext): ProcessedQuestion[]
  /** 出題UIコンポーネント */
  layoutComponent: React.ComponentType<QuestionLayoutProps>
  /** タイムアタックで使用するか */
  availableInTimeAttack: boolean
}
```

**問題タイプレジストリ:**
```typescript
// registry.ts
const questionTypeRegistry = new Map<string, QuestionTypePlugin>()

export function registerQuestionType(plugin: QuestionTypePlugin) {
  questionTypeRegistry.set(plugin.id, plugin)
}

export function getQuestionType(id: string): QuestionTypePlugin { ... }
export function getAllQuestionTypes(): QuestionTypePlugin[] { ... }
```

**各問題タイプのエントリポイント（例: face-guess/index.ts）:**
```typescript
import { registerQuestionType } from '../../quiz/registry'
import { FaceGuessLayout } from './FaceGuessLayout'
import { generateFaceGuessQuestions } from './generator'

registerQuestionType({
  id: 'face-guess',
  displayName: '顔当て',
  generate: generateFaceGuessQuestions,
  layoutComponent: FaceGuessLayout,
  availableInTimeAttack: true,
})
```

**QuizScreenは薄いラッパーになる:**
```typescript
// QuizScreen.tsx（概念）
const plugin = getQuestionType(currentQuestion.typeId)
const Layout = plugin.layoutComponent
return (
  <QuizLayout header={...} footer={...}>
    <Layout question={currentQuestion} onAnswer={handleAnswer} />
  </QuizLayout>
)
```

### 改善: ストアの分割

前作の1330行 gameStore を機能別に分割する。

| ストア | 責務 |
|--------|------|
| gameStore | ゲーム進行状態（currentIndex, quizState, answers） |
| settingsStore | ゲーム設定・LocalStorage永続化 |
| achievementStore | バッジ・解放状態・LocalStorage永続化 |

各ストアは100〜300行程度を目安とする。

### 改善: アチーブメントのデータ駆動化

前作のハードコードされたアチーブメントをデータ定義に置き換える。

```typescript
// definitions.ts
export const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'gen2-bau',
    slot: 0,
    area: 'gen2',
    type: 'clear',
    range: 'bau',
    evolvable: true, // ブロンズ→シルバー→ゴールド
  },
  // ...
]
```

条件チェックも汎用的な判定関数で処理し、個別のif文を不要にする。
