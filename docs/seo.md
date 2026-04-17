# SEO対策

「パレ学マスター」でGoogle検索結果にインデックスされることを目標とする。

## 背景

前作はGoogle検索に載らなかった。主な原因：
- SPAの `index.html` が `<div id="root"></div>` のみで、Googlebotが静的コンテンツを認識できない
- robots.txt / sitemap.xml / canonical タグがない
- GitHub Pages のサブパス（`github.io/parermaster/`）で独自ドメインがない
- Google Search Console でのインデックス登録リクエストを行っていない可能性

## 対策一覧

### 優先度: 高

#### 1. index.html に静的テキストを埋め込む

JSレンダリングなしでもGooglebotがコンテンツを認識できるようにする。

```html
<!-- React マウント前に表示されるテキスト（マウント後は非表示になる） -->
<div id="root">
  <h1>パレ学マスター 2nd Season</h1>
  <p>パレデミア学園の寮生たちの顔と名前を覚えよう！顔当て・名前当て・知識クイズなど多彩な問題タイプで遊べるクイズゲームです。</p>
</div>
```

React がマウントされると `#root` の中身は上書きされるため、ユーザー体験には影響しない。

#### 2. Google Search Console で手動インデックス登録

- デプロイ後、Google Search Console の「URL検査」で対象URLを送信
- 「インデックス登録をリクエスト」を実行
- 最も即効性のある対策

#### 3. meta タグの充実

```html
<title>パレ学マスター 2nd Season — パレデミア学園クイズゲーム</title>
<meta name="description" content="パレデミア学園の寮生たちの顔と名前を覚えよう！顔当て・名前当て・知識クイズなど多彩な問題タイプで遊べるWebクイズゲーム。">
<link rel="canonical" href="https://（デプロイ先URL）/">
```

### 優先度: 中

#### 4. robots.txt

```
User-agent: *
Allow: /
Sitemap: https://（デプロイ先URL）/sitemap.xml
```

#### 5. sitemap.xml

SPAなのでページは1つだが、明示的にGoogleに伝える。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://（デプロイ先URL）/</loc>
    <lastmod>2026-04-XX</lastmod>
  </url>
</urlset>
```

#### 6. OGP画像の設定

Xでシェアされた際にリッチなプレビューが表示されるようにする。Xからのリンクは Google にとってのシグナルにもなる。

```html
<meta property="og:title" content="パレ学マスター 2nd Season">
<meta property="og:description" content="パレデミア学園の寮生クイズゲーム">
<meta property="og:image" content="https://（デプロイ先URL）/ogp.png">
<meta property="og:url" content="https://（デプロイ先URL）/">
<meta property="og:type" content="website">
<meta property="og:locale" content="ja_JP">
<meta name="twitter:card" content="summary_large_image">
```

## チェックリスト

- [x] index.html に静的テキスト埋め込み
- [x] meta title / description / canonical 設定
- [x] OGP タグ設定
- [x] OGP 画像作成（ogp.png）
- [x] robots.txt 作成
- [x] sitemap.xml 作成
- [x] Google Search Console にサイト登録
- [x] Google Search Console でインデックス登録リクエスト
- [x] Google Search Console でサイトマップ送信
- [x] `og:site_name` メタタグ追加
- [x] `WebSite` JSON-LD 追加（サイト名の明示的シグナル）
- [ ] Google検索結果に favicon が出るようルートサイトを整備（下記参照）

## 未着手: 検索結果 favicon 対応（ルートサイト新設）

### 問題

Googleの公式仕様上、検索結果のfaviconは**ホスト単位で1つ**しか出ない。かつ**サブディレクトリ型ホームページは対象外**と明記されている。

> "Google Search only supports one favicon per site, where a site is defined by the hostname."
> "Not supported: `https://example.com/news` (this is a subdirectory-level home page)"

出典: https://developers.google.com/search/docs/appearance/favicon-in-search

現状 `parerdemia-fan.github.io/parermaster2/` はサブディレクトリ型のため、ルート `parerdemia-fan.github.io/` にfaviconが無ければ検索結果のアイコンはデフォルト表示のまま。

### 解決策

`parerdemia-fan/parerdemia-fan.github.io` リポジトリを新規作成し、最小の `index.html` と favicon画像を配置する。GitHub Pagesがユーザーサイトとして `parerdemia-fan.github.io/` に自動配信してくれる。

### 実装時に決めること

- ルートページの中身（リダイレクト / ランディング / 他作品リスト）
- ルートページのタイトル・ブランディング（「パレデミア学園 非公式ファンサイト」等）
- favicon画像のサイズ調整（現状 `favicon_2nd.png` は 568KB と大きい。48px以上のPNG/ICOに最適化推奨）
- 既存 `parermaster2` の workflow からのクロスリポジトリ自動push を組むか、独立管理にするか

### 手順（予定）

1. GitHub上で `parerdemia-fan/parerdemia-fan.github.io` リポジトリを作成
2. 最小 `index.html`（faviconリンク・OGP・`WebSite` JSON-LD 付き）を配置
3. favicon画像（`favicon.ico` と必要なサイズのPNG）を配置
4. `main` ブランチに push（Pages 自動有効）
5. Google Search Console で `parerdemia-fan.github.io` をプロパティ登録 → インデックス送信
6. 数日〜数週間後、検索結果にfaviconが反映されているか確認
