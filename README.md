# タスク管理アプリ

案件ごとにタスクを管理できるReact製Webアプリです。データはブラウザのローカルストレージに保存されます。

## 主な機能

- 「進行中」「期限切れ」「完了」「これから」の4状態で管理
- 案件ごとのタスク整理と絞り込み
- 開始日時・終了日時の登録
- カレンダー上でタスクの実施期間を表示
- 優先度、検索、並び替え、チェックリスト、メモ
- 複数タスクの一括完了・一括メモ

## ローカルで起動

```bash
npm install
npm start
```

`http://localhost:3000/task-manager` を開きます。

## GitHub Pagesで公開

このプロジェクトは次のURL向けに設定されています。

`https://koba220.github.io/task-manager`

GitHubで `koba220/task-manager` リポジトリを作成し、このフォルダの中身を `main` ブランチへアップロードします。その後、ローカルで次を実行します。

```bash
npm install
npm run deploy
```

`gh-pages` ブランチが作成されます。GitHubのリポジトリで **Settings → Pages** を開き、公開元が `gh-pages` ブランチになっていることを確認してください。

別のGitHubユーザー名やリポジトリ名を使う場合は、`package.json` の `homepage` を実際の公開URLへ変更してからデプロイしてください。

