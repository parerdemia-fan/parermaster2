# デプロイ手順

## 前提

- ローカルの `master` ブランチに開発履歴がある（GitHubには載せない）
- GitHub には `main` ブランチを初版として履歴なしでプッシュする
- GitHub Pages は GitHub Actions でビルド・デプロイ（`.github/workflows/deploy.yml`）

## 初回デプロイ

```bash
# 1. GitHub にリポジトリ作成（public）
gh repo create parerdemia-fan/parermaster2 --public

# 2. リモート追加
git remote add origin https://github.com/parerdemia-fan/parermaster2.git

# 3. orphan ブランチで初版コミット（ローカル履歴を含めない）
git checkout --orphan main
git add -A
git commit -m "初版リリース"

# 4. プッシュ
git push -u origin main

# 5. GitHub Pages 設定
#    リポジトリ Settings → Pages → Source: 「GitHub Actions」を選択

# 6. 自動デプロイが走り、数分後に公開される
#    https://parerdemia-fan.github.io/parermaster2/

# 7. Google Search Console でインデックス登録リクエスト

# 8. ローカルの master ブランチに戻る
git checkout master
```

## 更新デプロイ

```bash
# master で作業した変更を main に反映してプッシュ
git checkout main
git checkout master -- .
git add -A
git commit -m "更新内容の説明"
git push origin main

# ローカルの master に戻る
git checkout master
```

## 注意事項

- `.gitignore` により以下は GitHub に載らない: `scripts/`, `secrets/`, `docs/tasks.md`
- `master` ブランチはローカル専用（開発履歴の保存用）
- `main` ブランチは GitHub 公開用（初版 + 更新のみ）
- `main` への push で GitHub Actions が自動実行されデプロイされる
