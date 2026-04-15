# ブラウザバック制御

## 背景

モバイルブラウザでは画面端スワイプでブラウザバックが発動する。本ゲームはSPA（Single Page Application）であり、URL は 1 つしかないため、ブラウザバックすると別サイトに遷移してしまう。

## 要件

1. **ブラウザバック = アプリ内の「戻る」動作にする**
   - 各画面の「戻る」ボタンと同じ動作をブラウザバックに割り当てる
2. **タイトル画面でのブラウザバック = 確認ダイアログ**
   - タイトル画面は最上位画面であり、戻り先がない
   - ブラウザバック時に「ゲームを終了しますか？」等の確認を表示する

## 設計

### History API によるスタック管理

画面遷移のたびに `history.pushState` でブラウザの履歴スタックにエントリを追加し、`popstate` イベントでアプリ内の「戻る」を実行する。

#### 画面ごとの戻り先マッピング

| 現在の画面 | ブラウザバックの動作 |
|---|---|
| title | 確認ダイアログを表示（後述） |
| setting | → title |
| quiz | 確認ダイアログ → title（やめるボタンと同じ） |
| result | → title |
| time-attack-result | → title |
| learning | → title |
| talents | → title |
| achievements | → title |
| about | → title |
| diary | → title |
| diagnosis | → title |
| diagnosis-result | → diagnosis（もう一度遊ぶと同じ） |
| debug | → title |

### タイトル画面の確認ダイアログ

タイトル画面では `popstate` 発火時に以下の処理を行う:

1. `history.pushState` で履歴を補充（連続バック防止）
2. 確認ダイアログを表示：「ページを離れますか？」
3. OK → `history.back()` で実際にページを離脱
4. キャンセル → 何もしない（pushState で履歴は補充済み）

### 実装方針

`App.tsx` またはカスタムフック `useBackNavigation` で一元管理する。

```
useEffect で:
  1. マウント時に history.pushState で初期エントリを追加
  2. popstate リスナーを登録
  3. screen に応じた戻り先メソッドを呼ぶ
  4. 呼んだ後に history.pushState で履歴を補充
```

#### 注意点

- `goTo*` メソッド呼び出し時にも `pushState` が必要。ただし画面遷移のたびに二重 push しないよう、`popstate` 起因の遷移かアプリ内ボタン起因の遷移かを区別する
- タイムアタック中のブラウザバックは誤操作の可能性が高いため、確認なしで戻さない方がよいかもしれない（要検討）
- `beforeunload` イベントはモバイルブラウザでは信頼性が低いため、`popstate` + `pushState` の組み合わせで制御する
