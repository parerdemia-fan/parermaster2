# データ設計

[メイン仕様書](specification.md) > データ設計

全JSONファイルはcamelCaseで統一する（前作はsnake_case混在だったが、TypeScriptとの親和性のためcamelCaseに統一）。

---

## 1. ファイル一覧

| ファイル | 内容 | 備考 |
|---------|------|------|
| `public/data/talents.json` | タレントデータ（1期生+2期生） | 前作から構造変更 |
| `public/data/questions.json` | 知識クイズ問題（1期生+2期生） | 前作から構造変更 |
| `public/data/awards.json` | イベント実績データ | 新規（前作はtalents.json内） |
| `public/data/diary.json` | 開発日誌 | 前作踏襲 |
| `public/data/quotes.json` | アシスタントセリフ | `pnpm sync` で生成 |
| `public/data/personality.json` | タレント性格スコア（相性診断用） | 手動編集 |
| `public/data/diagnosis-questions.json` | 相性診断の質問データ | 手動編集 |
| `public/data/staff.json` | スタッフロールデータ | 手動編集 |

前作の `answer_set.json` は独立ファイルとしては廃止。寮別タレントリストは talents.json の dormitory フィールドから動的に生成する。イベント系等のカスタム選択肢セットは questions.json 内の `answerSets` に統合。

### データ同期

- Googleスプレッドシートをマスタデータとし、`pnpm sync` で各JSONを自動生成する
- スプレッドシートのシート構成: 1期生, 受賞歴, 知識問題, 選択肢セット（知識問題シートに「世代」列を持ち、問題ごとに世代を明示する）
- スクリプト: `scripts/sync-spreadsheet.ts`
- 設定（スプレッドシートID・認証情報パス）: `scripts/sync-config.json`（gitignore対象）
- 退学者（dropout列に値がある行）はtalents.json・awards.jsonから自動的に除外される

---

## 2. タレントデータ（talents.json）

```jsonc
{
  "version": 2,
  "talents": [
    {
      // === 識別 ===
      "id": "25CO001",           // 学籍番号（一意ID）
                                  //   先頭2桁: 入学年（25=2025→1期生, 26=2026→2期生）
                                  //   続く2文字: 寮コード（CO/WA/ME/WH）
                                  //   末尾3桁: 通し番号
      "generation": 1,           // 世代（1=1期生, 2=2期生）
                                  //   ※ idから導出可能だがフィルタ性能・可読性のため明示
      "dormitory": "co",         // 寮コード（"co"/"wa"/"me"/"wh"）
                                  //   ※ 同上の理由で明示。idとの整合性はバリデーションで保証

      // === 名前 ===
      "name": "星空ひかり",       // フルネーム
      "kana": "ホシゾラヒカリ",    // フルネーム（カナ）
      "familyName": "星空",       // 姓（スプレッドシートのname_separatedからスペースで分割）
      "givenName": "ひかり",      // 名
      "familyKana": "ホシゾラ",   // 姓カナ（kana_separatedから同様に分割）
      "givenKana": "ヒカリ",      // 名カナ
      "nickname": "ひかりん",     // あだ名（空文字列可）
      "firstPerson": "わたし",    // 一人称（空文字列可）
      "tone": "丁寧語",           // 口調（アシスタントセリフ生成用。空文字列可）

      // === プロフィール ===
      "intro": "...",             // 自己紹介文（空文字列可）
      "dream": "みんなを笑顔にするアイドル",
      "birthday": "3月15日",
      "height": 158,              // cm
      "bloodType": "A",           // 血液型（"A"/"B"/"O"/"AB"/""）
      "hairColor": "pink",        // 髪色
      "hairStyle": "ロング",       // 髪型
      "eyeColorLeft": "blue",     // 左目の色
      "eyeColorRight": "blue",    // 右目の色（オッドアイ対応）
      "mbti": "INFJ",             // MBTI（空文字列可）

      // === ファン情報 ===
      "fanName": "ひかりっ子",     // ファン呼称（空文字列可）
      "fanMark": "⭐",            // ファンマーク（空文字列可）

      // === 趣味・特技等 ===
      "hashtags": [               // ハッシュタグ（用途付き）
        { "tag": "#星空ひかり", "usage": "" },
        { "tag": "#ひかりの絵", "usage": "ファンアート" },
        { "tag": "#ひかりの配信", "usage": "配信" }
      ],
      "hobbies": ["歌", "星を見ること"],
      "skills": ["即興ソング"],
      "favorites": ["プリン", "星のカービィ"],

      // === SNS・リンク ===
      "links": [
        { "type": "official", "url": "https://..." },
        { "type": "youtube",  "url": "https://..." },
        { "type": "x",        "url": "https://..." },
        { "type": "tiktok",   "url": "https://..." },
        { "type": "marshmallow", "url": "https://..." }
      ]
      // ※ 新しいSNSが追加されてもスキーマ変更不要
    }
  ]
}
```

### 前作からの主な変更点

| 項目 | 前作 | 2nd Season | 理由 |
|------|------|-----------|------|
| ID | 暗黙（配列index） | `id`（学籍番号） | 安定した参照 |
| 世代 | なし | `generation` | 1期生/2期生の区別 |
| 姓名 | `name_separated`（文字列） | `familyName` + `givenName` | name_separatedをスペースで分割。洋風名は正確でない場合がある |
| 寮 | 正式名のみ | コード（`"co"`等） | questions.jsonとの統一 |
| 目の色 | なし | `eyeColorLeft` + `eyeColorRight` | オッドアイ対応 |
| 血液型 | なし | `bloodType` | プロフィール拡充 |
| ハッシュタグ | 文字列配列 | `{tag, usage}` 配列 | 用途別分類対応 |
| SNS | 個別フィールド×5 | `links` 配列 | SNS追加時にスキーマ変更不要 |
| awards | 文字列配列 | 別ファイルに分離 | 構造化・共有データとして管理 |
| キー命名 | snake_case混在 | camelCase統一 | TypeScript親和性 |

### 寮マスタ

寮コードと表示名の対応はソースコード内の定数で定義する。

```typescript
export const DORMITORIES = {
  wa: { name: 'バゥ寮', order: 0 },
  me: { name: 'ミュゥ寮', order: 1 },
  co: { name: 'クゥ寮', order: 2 },
  wh: { name: 'ウィニー寮', order: 3 },
} as const
```

2期生の寮構成は1期生と同じ4寮（バゥ寮・ミュゥ寮・クゥ寮・ウィニー寮）。ただし将来の変更に備え、寮数・寮名をハードコードしない設計とする。

---

## 3. 問題データ（questions.json）

知識クイズの問題データ。顔名前当ての問題は talents.json から動的に生成されるため、ここには含まない（前作踏襲）。

```jsonc
{
  "version": 2,
  "questions": [
    {
      "id": "q001",              // 一意ID
      "generation": 1,           // 対象世代（1=1期生, 2=2期生, 0=世代無関係）— スプレッドシートの「世代」列から取得
      "question": "この中で身長が一番高いのは？",
      "answers": [               // 選択肢（[0]が正解、表示時にシャッフル。前作踏襲）
        "桜雲ほわり",
        "月読みるく",
        "猫乃間うと",
        "姫宮ねね"
      ],
      "difficulty": 2,           // 難易度（0〜8。前作は0〜5だったが拡張可能に）
      "genre": "プロフィール",    // ジャンル（表示用。判定には使わない）
      "sortAnswers": false,      // 選択肢をソートして表示するか
      "hideIcon": false,         // タレントアイコンを回答前に隠すか
      "questionImage": null,     // 問題画像ファイル名（null=なし。配置先: public/data/images/questions/）
      "commentImage": null,      // 解説画像ファイル名（null=なし。同上）
      "answerPool": "",           // レガシーフィールド（未使用）。選択肢補完は空文字列と[セット名]形式で行う（後述）
      "comment": "桜雲ほわりは172cmで最も背が高い"
      "sourceUrl": ""            // 出典URL
    }
  ],
  "answerSets": {               // カスタム選択肢セット（寮・世代で表現できないグループ）
    "声劇サークル": ["タレント名1", "タレント名2", "..."],
    "バレンタイングッズ化": ["タレント名1", "タレント名2", "..."]
  }
}
```

### 前作からの主な変更点

| 項目 | 前作 | 2nd Season | 理由 |
|------|------|-----------|------|
| ID | なし | `id` | 追加・削除・並べ替えに強い |
| 世代 | なし | `generation` | 1期生/2期生+共通問題の区別 |
| category | `"基本問題"` / `"深堀り問題"` | 廃止 | difficultyで区別可能 |
| difficulty | 0〜5 | 0〜8（拡張可能） | 将来の難易度追加に備える |
| dormitory | 寮コード | 廃止 | 知識クイズは寮ごとの出題がないため不要 |
| questioner | 全問空 | 廃止 | 未使用のため削除 |
| image | question直下 + comment内 `[image:]` 混在 | `questionImage` + `commentImage` に分離 | 用途を明確に分離し、独立して指定可能に |
| genre | 表記揺れあり | そのまま踏襲 | 表示用のみ。判定に使わないため正規化不要 |
| answer_set.json | 別ファイル | `answerSets` として questions.json に統合 | ファイル数削減 |
| キー命名 | snake_case | camelCase | TypeScript親和性 |

### 知識クイズの画像表示

- 画像ファイルは `public/data/images/questions/` に配置
- `questionImage` — 問題文の下に表示する画像（出題時に表示）
- `commentImage` — 解説テキストと一緒に表示する画像（回答後に表示）
- いずれも null で画像なし。片方だけ・両方・両方とも別画像、いずれも可
- 前作では `image` フィールドと comment 内の `[image:]` 記法が混在していたが、2フィールドに分離して明確化

### 選択肢の自動補完

知識クイズの選択肢は通常4つすべてスプレッドシートに記入するが、一部を空文字列にしたり `[セット名]` 形式にすることで、ゲーム側が実行時に自動補完する。

**スプレッドシートの記入例:**

| 問題文 | 選択肢1(正解) | 選択肢2 | 選択肢3 | 選択肢4 |
|--------|-------------|---------|---------|---------|
| ミュゥ寮で一番背が高いのは？ | 月読みるく | | | |
| 声劇サークルのリーダーは？ | 星空ひかり | [声劇サークル] | [声劇サークル] | [声劇サークル] |
| この中で身長が一番高いのは？ | 桜雲ほわり | 月読みるく | 猫乃間うと | 姫宮ねね |

**補完ルール:**

| 選択肢の値 | 動作 |
|-----------|------|
| 通常テキスト | そのまま使用 |
| 空文字列 `""` | 問題の世代に応じたタレント名からランダム補完（generation=0 は全タレント、1/2 は該当世代のみ） |
| `[セット名]` | questions.json の `answerSets` から該当セットのメンバーをランダム選出 |

**ゲーム側の補完ロジック（`text-quiz/generator.ts` の `fillAnswers`）:**
1. 各選択肢を順にチェック
2. `[セット名]` 形式 → `answerSets` から未使用のメンバーをランダム選出
3. 空文字列 → 問題の世代でフィルタしたタレントプールから未使用の名前をランダム選出
4. 正解や既に使用した名前とは重複しない
5. 補完後にシャッフル（`sortAnswers=true` の場合はソート）して表示

---

## 4. イベント実績データ（awards.json）

前作では talents.json 内の `awards[]` に文字列で格納していたが、構造化して別ファイルに分離する。

```jsonc
{
  "version": 1,
  "awards": [
    {
      "id": "a001",
      "eventDate": "202512",          // イベント開催年月（YYYYMM）
      "eventName": "歌うま選手権",     // イベント名
      "result": "優勝",               // 順位・結果
      "talentId": "25CO001"           // 対象タレントのID（学籍番号）
    },
    {
      "id": "a002",
      "eventDate": "202602",
      "eventName": "バレンタイングッズ化投票",
      "result": "グッズ化決定",
      "talentId": "25WH005"
    }
  ]
}
```

**設計意図:**
- 同一イベントに複数タレントが関係する場合も個別レコードで管理
- `talentId` で talents.json と結合
- `eventDate` でソート・フィルタ可能
- タレント詳細画面で `talentId` でフィルタして表示

---

## 5. バッジスロットID定義

| スロットID | 対応 | 最大ランク |
|-----------|------|-----------|
| `gen2_all` | 2期生・全員 | gold |
| `gen2_knowledge` | 2期生・知識クイズ | bronze（難易度なしのため） |
| `gen1_all` | 1期生・全員 | gold |
| `gen1_knowledge` | 1期生・知識クイズ | gold |
| `dorm_wa` | バゥ寮（1期+2期混合） | gold |
| `dorm_me` | ミュゥ寮（1期+2期混合） | gold |
| `dorm_co` | クゥ寮（1期+2期混合） | gold |
| `dorm_wh` | ウィニー寮（1期+2期混合） | gold |

---

## 6. 永続化データ（LocalStorage）

| キー | 内容 | 型 |
|------|------|-----|
| `parermaster2_badges` | バッジ獲得状況 | `Record<BadgeSlotId, 'bronze' \| 'silver' \| 'gold'>` |
| `parermaster2_settings` | 前回のゲーム設定 | `{ gameMode: 'face-name' \| 'knowledge' \| 'learning', scope: DormId \| 'all', difficulty: 1 \| 2 \| 3, dormScope?: DormId }` |
| `playerName` | プレイヤー名 | `string`（デフォルト: `"リスナー"`） |
| `parermaster2_ta_best` | タイムアタック自己ベスト | `number \| null`（ミリ秒） |
| `parermaster2_diary_entries` | 開発日誌の手記エントリ（動的生成分） | `DiaryMemoirEntry[]` |
| `parermaster2_room` | 談話室選択状態 | `{ left: string \| null, center: string \| null, right: string \| null, dormitory: DormId }` |
| `parermaster2_staff_roll_seen` | スタッフロール初回自動再生済みフラグ | `boolean` |
