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
- [ ] OGP 画像作成（ogp.png）
- [x] robots.txt 作成
- [x] sitemap.xml 作成
- [ ] Google Search Console にサイト登録
- [ ] Google Search Console でインデックス登録リクエスト
