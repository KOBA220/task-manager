# タスク管理システム

React 製のタスク管理アプリです。

## 機能

- タスクカードの追加・編集・削除
- 優先度（高 / 中 / 低 / なし）の設定
- 期限の設定（期限切れ・もうすぐ期限の視覚的警告）
- カレンダー表示（タスクが紐づいた日を色付き表示）
- 各タスクのメモ機能
- チェックボックス付きのチェックリスト
- 複数タスクを選択してメモを一括入力（追記 / 上書き）
- 完了タブ（完了したタスクを分けて表示）
- フィルター・並び替え・検索
- ローカルストレージへの自動保存

## ファイル構成

```
task-manager/
├── public/
│   └── index.html          # HTMLテンプレート
├── src/
│   ├── index.js            # エントリーポイント
│   ├── index.css           # グローバルスタイル・CSS変数
│   ├── App.jsx             # メインアプリ（状態管理・レイアウト）
│   ├── hooks/
│   │   └── useTasks.js     # タスクCRUD + localStorage保存
│   ├── utils/
│   │   └── helpers.js      # 日付処理・定数・初期データ
│   └── components/
│       ├── TaskCard.jsx     # タスクカード1件
│       ├── TaskModal.jsx    # タスク追加・編集モーダル
│       ├── BulkMemoModal.jsx  # まとめてメモモーダル
│       ├── Calendar.jsx    # カレンダーコンポーネント
│       └── DayTasksModal.jsx  # カレンダー日付クリック時のモーダル
└── package.json
```

## セットアップ

```bash
cd task-manager
npm install
npm start
```

ブラウザで `http://localhost:3000` を開いてください。
