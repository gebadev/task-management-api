# CLAUDE.md

このファイルは、このリポジトリで作業する際にClaude Code (claude.ai/code) へのガイダンスを提供します。

## プロジェクトの目的

これは、複数のターミナルインスタンスでの同時開発を処理するClaude Codeの能力をテストするための**並列開発検証プロジェクト**です。コードベースは、Node.jsとExpressで構築されたシンプルなタスク管理REST APIです。

**重要**: このプロジェクトは、並列開発中に意図的にマージコンフリクトを発生させるように設計されています。複数のClaude Codeインスタンスが別々のGitHub Issueに同時に取り組み、マージを処理する方法を検証することが目的です。

## アーキテクチャ

APIは、関心事の厳密な分離を持つレイヤードアーキテクチャに従います：

```
Routes → Controllers → Services → Data Access → Database
```

- **Routes Layer** (`src/routes/`): エンドポイント定義のみ。各機能モジュール（tasks、users、comments、stats）は独自のルートファイルを持ちます。すべてのルートは`src/routes/index.js`に集約されます。
- **Controllers Layer** (`src/controllers/`): リクエスト/レスポンス処理とバリデーションロジック。コントローラーにビジネスロジックを含めてはいけません。
- **Services Layer** (`src/services/`): すべてのビジネスロジックはここに配置します。サービスは機能固有で独立しています。
- **Data Access Layer** (`src/db/`): パラメータ化されたステートメントを使用した直接的なSQLクエリ。ORMなし - シンプルさのため生のSQLiteを使用します。

### データモデル

3つのコアエンティティと関係：
- **users**: ハッシュ化されたパスワードを持つ基本的なユーザー情報
- **tasks**: ステータス（todo/in_progress/done）、優先度（low/medium/high）、作成者、オプションの担当者を持つコアエンティティ
- **comments**: タスクに添付され、ユーザーが作成

詳細なER図とテーブルスキーマは`docs/basic-design.md`を参照してください。

## 開発コマンド

### セットアップ
```bash
npm install              # 依存関係のインストール
npm run db:init          # スキーマとシードデータでSQLiteデータベースを初期化
```

### 開発
```bash
npm run dev              # ホットリロード付き開発サーバー起動
npm test                 # すべてのテスト実行
npm run test:watch       # ウォッチモードでテスト実行
npm run test:coverage    # カバレッジレポート付きでテスト実行
npm run lint             # ESLintを実行
npm run format           # Prettierを実行
```

### データベース
```bash
npm run db:init          # schema.sqlとseed.sqlからデータベースを作成/リセット
npm run db:reset         # データベースを削除して再作成
```

## 主要な実装ノート

### マージコンフリクトのホットスポット

以下のファイルは複数のIssueで変更され、慎重な調整が必要です：
- `src/routes/index.js` - ルート集約ポイント
- `src/app.js` - ミドルウェア登録
- `package.json` - 依存関係の追加
- `README.md` - ドキュメント更新

Issueに取り組む際は、これらのファイルに触れる場合は注意し、マージを慎重に調整してください。

### APIレスポンス形式

すべてのエンドポイントは一貫したレスポンス構造に従います：
```json
{
  "success": true,
  "data": { /* 結果 */ },
  "pagination": { /* 該当する場合 */ }
}
```

エラーレスポンス：
```json
{
  "success": false,
  "error": "エラーメッセージ"
}
```

### データベース規約

- SQLインジェクションを防ぐため、すべてのSQLにパラメータ化クエリを使用
- 外部キーは強制されます：`PRAGMA foreign_keys = ON`
- タイムスタンプはISO 8601形式を使用
- `created_at`と`updated_at`はトリガーで自動管理

### テスト戦略

- **単体テスト**: Services層に焦点（目標: 90%カバレッジ）
- **統合テスト**: Supertestを使用した完全なエンドポイントE2Eテスト（目標: 80%カバレッジ）
- 各機能はコントローラー名に一致する独自のテストファイルを持つべき
- 各テストスイートの前にリセットされる別のテストデータベースを使用

### セキュリティ考慮事項

- パスワードはbcryptでハッシュ化する必要があります（コストファクター: 10）
- すべてのユーザー入力はexpress-validatorで検証
- SQLクエリはパラメータ化されたステートメントを使用
- 入力サニタイゼーションによるXSS保護

## 並列開発ワークフロー

このプロジェクトは10個のIssueでの並列開発用に設計されています（`docs/basic-design.md`のセクション6を参照）。Issueに取り組む際は：

1. 各Issueは重複を最小限に抑えるため特定のファイルをターゲットにします
2. テストを含む機能実装を完了します
3. コミット前に完全なテストスイートを実行します
4. 上記のホットスポットファイルでのマージコンフリクトに対処する準備をします
5. あなたのIssueがデータベーススキーマに依存する場合、Issue #2（データベースセットアップ）が完了していることを確認してください

## ファイル構成

- **エントリーポイント**: `server.js`がExpressサーバーを起動
- **アプリ設定**: `src/app.js`がExpressミドルウェアとルートを設定
- **データベース**: `data/tasks.db`のSQLiteファイル（gitignore対象）
- **テスト**: `tests/`で`src/`の構造をミラーリング
- **ドキュメント**: `docs/`に設計ドキュメントとAPI仕様

## 環境

- Node.js v18以上が必要
- データベースにSQLite3を使用
- 外部サービスやAPIなし
- デフォルトでポート3000で開発実行
