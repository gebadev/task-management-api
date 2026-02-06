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
  "data": {
    /* 結果 */
  },
  "pagination": {
    /* 該当する場合 */
  }
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

## ブランチ戦略

**このプロジェクトは並列開発検証のため、厳密なブランチ戦略に従う必要があります。**

### ブランチ命名規則

**必須フォーマット:**

```
feature/issue-{番号}
```

**例:**

- `feature/issue-1`
- `feature/issue-3`
- `feature/issue-7`

**ルール:**

- Issue番号は必須（1桁または2桁の数字）
- 説明は不要（Issue番号のみ）

### ブランチ作成のルール

**必ず以下の手順に従ってください:**

1. **作業開始前に必ずmainから最新を取得:**

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Issueブランチを作成:**

   ```bash
   git checkout -b feature/issue-{番号}
   ```

3. **ブランチのプッシュ:**
   ```bash
   git push -u origin feature/issue-{番号}
   ```

### 開発フロー

Issueに取り組む際は、以下の順序で作業してください：

1. **ブランチ作成** - 上記のルールに従ってブランチを作成
2. **機能実装** - レイヤードアーキテクチャに従って実装
3. **テスト作成** - 単体テスト・統合テストを作成
4. **ローカルテスト** - `npm test`で全テスト実行
5. **リンター実行** - `npm run lint`でコード品質確認
6. **コミット** - 意味のあるコミットメッセージで保存
7. **プッシュ** - リモートブランチにプッシュ
8. **PR作成** - GitHubでPull Requestを作成

### コミットルール

**コミットメッセージフォーマット:**

```
[Issue #{番号}] {動詞}: {変更内容}

{詳細説明（オプション）}
```

**例:**

```
[Issue #3] feat: ユーザーCRUDエンドポイントを実装

- routes/users.jsの作成
- controllers/usersController.jsの実装
- services/userService.jsのビジネスロジック追加
- tests/users.test.jsの統合テスト追加
```

**推奨される動詞:**

- `feat`: 新機能追加
- `fix`: バグ修正
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `docs`: ドキュメント更新
- `chore`: 雑務（依存関係更新など）

### マージルール

**必須条件:**

- ✅ すべてのテストが成功していること（`npm test`）
- ✅ リンターが通っていること（`npm run lint`）
- ✅ コンフリクトが解決されていること
- ✅ PRのタイトルとdescriptionが明確であること

**PR作成時のテンプレート:**

```markdown
## 概要

Issue #{番号} の実装

## 変更内容

- 実装した機能のリスト
- 変更したファイルの概要

## テスト

- [ ] 単体テスト追加
- [ ] 統合テスト追加
- [ ] すべてのテストが成功

## チェックリスト

- [ ] リンター通過
- [ ] アーキテクチャのレイヤー分離を遵守
- [ ] APIレスポンス形式に準拠
- [ ] データベースクエリはパラメータ化
```

### 競合解決のガイドライン

マージコンフリクトが発生した場合：

1. **mainブランチの最新を取得:**

   ```bash
   git fetch origin main
   ```

2. **rebaseまたはmergeで取り込み:**

   ```bash
   # rebaseの場合（推奨）
   git rebase origin/main

   # mergeの場合
   git merge origin/main
   ```

3. **競合箇所を確認:**

   ```bash
   git status
   ```

4. **競合を解決:**
   - **ホットスポットファイル**（`src/routes/index.js`、`src/app.js`、`package.json`、`README.md`）は特に慎重に
   - 両方の変更を保持し、統合する形で解決
   - 削除ではなく、追加の形で解決を優先

5. **解決後のテスト:**

   ```bash
   npm test
   npm run lint
   ```

6. **解決をコミット:**
   ```bash
   git add .
   git commit -m "[Issue #{番号}] fix: mainとの競合を解決"
   git push origin feature/issue-{番号}
   ```

### 禁止事項

**以下の操作は絶対に行わないでください:**

- ❌ mainブランチへの直接コミット・プッシュ
- ❌ 他のIssueブランチへのマージ
- ❌ force pushの使用（`git push -f`）
- ❌ テスト失敗状態でのPR作成
- ❌ 命名規則に従わないブランチ名
- ❌ Issue番号のないブランチ作成

### 並列開発の実施順序

**依存関係のあるIssueの順序:**

**フェーズ1: 基盤（必須）**

```
Issue #1（プロジェクトセットアップ）→ Issue #2（データベースセットアップ）
```

**フェーズ2: 並列開発グループA（同時進行可能）**

```
並列実行:
- Issue #3（ユーザー管理）
- Issue #4（タスクCRUD基本）
- Issue #7（コメント機能）

競合予想箇所: src/routes/index.js
```

**フェーズ3: 並列開発グループB（同時進行可能）**

```
並列実行:
- Issue #5（タスクフィルタリング）
- Issue #6（タスク割り当て）
- Issue #8（統計情報）

競合予想箇所: services/taskService.js
```

**フェーズ4: 仕上げ**

```
- Issue #9（エラーハンドリング）→ src/app.js修正
- Issue #10（ドキュメント）→ README.md更新
```

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
