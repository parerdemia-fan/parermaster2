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
| `public/data/result_messages.json` | 結果画面メッセージ | 前作踏襲（構造は要検討） |
| `public/data/staff.json` | スタッフクレジット | 前作踏襲 |

前作の `answer_set.json` は独立ファイルとしては廃止。寮別タレントリストは talents.json の dormitory フィールドから動的に生成する。イベント系等のカスタム選択肢セットは questions.json 内の `answerSets` に統合。

### データ同期

- Googleスプレッドシートをマスタデータとし、`pnpm sync` で各JSONを自動生成する
- スプレッドシートのシート構成: 1期生, 受賞歴, 知識問題, 選択肢セット
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
  co: { name: 'クゥ寮', order: 0 },
  me: { name: 'ミュゥ寮', order: 1 },
  wa: { name: 'バゥ寮', order: 2 },
  wh: { name: 'ウィニー寮', order: 3 },
} as const
```

2期生の寮構成が1期生と異なる場合は、世代ごとに寮マスタを持てるようにする。寮数・寮名をハードコードしない。

---

## 3. 問題データ（questions.json）

知識クイズの問題データ。顔名前当ての問題は talents.json から動的に生成されるため、ここには含まない（前作踏襲）。

```jsonc
{
  "version": 2,
  "questions": [
    {
      "id": "q001",              // 一意ID
      "generation": 1,           // 対象世代（1=1期生, 2=2期生, 0=世代無関係）
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
      "image": null,             // 問題画像ファイル名（null=なし）
      "answerPool": "",           // 空の選択肢を自動補完するプール名（後述）
      "comment": "桜雲ほわりは172cmで最も背が高い",
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
| image | question直下 + comment内 `[image:]` 混在 | `image` に統一 | 二重管理の解消 |
| genre | 表記揺れあり | そのまま踏襲 | 表示用のみ。判定に使わないため正規化不要 |
| answer_set.json | 別ファイル | `answerSets` として questions.json に統合 | ファイル数削減 |
| キー命名 | snake_case | camelCase | TypeScript親和性 |

### 選択肢の自動補完（answerPool）

知識クイズの選択肢は通常4つすべてスプレッドシートに記入するが、選択肢の一部を空にして `answerPool` を指定すると、ゲーム側が実行時にプールからランダムに補完する。

**スプレッドシートの記入例:**

| 問題文 | 選択肢1(正解) | 選択肢2 | 選択肢3 | 選択肢4 | 選択肢補完元 |
|--------|-------------|---------|---------|---------|------------|
| ミュゥ寮で一番背が高いのは？ | 月読みるく | | | | 2期生/ミュゥ寮 |
| 声劇サークルのリーダーは？ | 星空ひかり | | | | 声劇サークル |
| この中で身長が一番高いのは？ | 桜雲ほわり | 月読みるく | 猫乃間うと | 姫宮ねね | |

**answerPool の命名規則:**

| 記法 | 意味 | プールの実体 |
|------|------|------------|
| （空） | 自動補完なし | 選択肢4つすべて記入必須 |
| `2期生/ミュゥ寮` | 2期生のミュゥ寮 | talents.json から generation=2, dormitory=me のタレント名 |
| `2期生/全員` | 2期生全員 | talents.json から generation=2 のタレント名 |
| `1期生/バゥ寮` | 1期生のバゥ寮 | talents.json から generation=1, dormitory=wa のタレント名 |
| `1期生/全員` | 1期生全員 | talents.json から generation=1 のタレント名 |
| `全員` | 全タレント | talents.json の全タレント名 |
| `声劇サークル` | カスタムセット | questions.json の `answerSets` から参照 |

**ゲーム側の補完ロジック:**
1. `answerPool` が空 → 補完なし（answers をそのまま使用）
2. `answerPool` が `N期生/寮名` or `N期生/全員` or `全員` → talents.json からフィルタしてプール生成
3. それ以外 → `answerSets` からカスタムセットを参照
4. answers の空文字列をプールからランダムに選んで埋める（正解と重複しないように）
5. 補完後にシャッフルして表示

---

## 4. イベント実績データ（awards.json）

前作では talents.json 内の `awards[]` に文字列で格納していたが、構造化して別ファイルに分離する。

```jsonc
{
  "version": 1,
  "awards": [
    {
      "id": "a001",
      "eventDate": "2025-12",        // イベント開催年月（YYYY-MM）
      "eventName": "歌うま選手権",     // イベント名
      "result": "優勝",               // 順位・結果
      "talentId": "25CO001"           // 対象タレントのID（学籍番号）
    },
    {
      "id": "a002",
      "eventDate": "2026-02",
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

## 5. 永続化データ（LocalStorage）

| キー | 内容 | 型 |
|------|------|-----|
| `parermaster2_badges` | バッジ獲得状況 | `Record<slotId, 'bronze' \| 'silver' \| 'gold'>` |
| `parermaster2_unlocked_types` | 解放済み問題タイプ | `string[]` |
| `parermaster2_settings` | 前回のゲーム設定 | `{ generation, game, range, difficulty, ... }` |
| `parermaster2_player_name` | プレイヤー名 | `string`（デフォルト: `"リスナー"`） |
| `parermaster2_time_attack_best` | タイムアタック自己ベスト | `number \| null`（ミリ秒） |
| `parermaster2_memoir` | AIの手記データ（生成済みエントリ） | `MemoirEntry[]` |
