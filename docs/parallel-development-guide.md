# 並列開発実施ガイド

## 概要

このドキュメントは、Claude Codeによる並列開発検証のための実施ガイドです。10個のIssueを4つのフェーズに分けて実装し、意図的にマージコンフリクトを発生させて解決する流れを検証します。

---

## Issue一覧と依存関係

### Phase 1: 基盤（必須・順次実行）

| Issue                                                         | タイトル                 | 依存 | 並列実行 |
| ------------------------------------------------------------- | ------------------------ | ---- | -------- |
| [#1](https://github.com/gebadev/task-management-api/issues/1) | プロジェクトセットアップ | なし | ❌       |
| [#2](https://github.com/gebadev/task-management-api/issues/2) | データベース設計と初期化 | #1   | ❌       |

**実施順序**: #1 → #2 （順次実行必須）

---

### Phase 2: 並列開発グループA（同時実行可能）

| Issue                                                         | タイトル               | 依存 | 並列実行 |
| ------------------------------------------------------------- | ---------------------- | ---- | -------- |
| [#3](https://github.com/gebadev/task-management-api/issues/3) | ユーザー管理機能       | #2   | ✅       |
| [#4](https://github.com/gebadev/task-management-api/issues/4) | タスクCRUD機能（基本） | #2   | ✅       |
| [#5](https://github.com/gebadev/task-management-api/issues/5) | コメント機能           | #2   | ✅       |

**実施順序**: #3、#4、#5を**同時に**3つのClaude Codeインスタンスで実装

**予想される競合ファイル**:

- `src/routes/index.js` - 各自が自分のルートを追加（確実に競合）
- `package.json` - 依存関係追加の可能性

---

### Phase 3: 並列開発グループB（同時実行可能）

| Issue                                                         | タイトル                 | 依存 | 並列実行 |
| ------------------------------------------------------------- | ------------------------ | ---- | -------- |
| [#6](https://github.com/gebadev/task-management-api/issues/6) | タスクフィルタリング機能 | #4   | ✅       |
| [#7](https://github.com/gebadev/task-management-api/issues/7) | タスク割り当て機能       | #4   | ✅       |
| [#8](https://github.com/gebadev/task-management-api/issues/8) | 統計情報機能             | #2   | ✅       |

**実施順序**: #6、#7、#8を**同時に**3つのClaude Codeインスタンスで実装

**予想される競合ファイル**:

- `src/services/taskService.js` - #6と#7が異なる関数を追加（部分的に競合）
- `src/routes/index.js` - #8が統計ルートを追加

---

### Phase 4: 仕上げ（並列実行可能）

| Issue                                                           | タイトル                           | 依存          | 並列実行 |
| --------------------------------------------------------------- | ---------------------------------- | ------------- | -------- |
| [#9](https://github.com/gebadev/task-management-api/issues/9)   | エラーハンドリングとバリデーション | Phase 2/3推奨 | ⚠️       |
| [#10](https://github.com/gebadev/task-management-api/issues/10) | ドキュメントとREADME               | 全Issue推奨   | ✅       |

**実施順序**: Phase 2と3が完了後、#9と#10を並列実行可能

**予想される競合ファイル**:

- `README.md` - 複数Issueで更新可能性
- `src/app.js` - #9がミドルウェアを追加

---

## 並列開発の実施手順

### ステップ1: Phase 1の実装（単独）

```bash
# Issue #1の実装
git checkout main
git pull origin main
git checkout -b feature/issue-1
# ... 実装 ...
git add .
git commit -m "[Issue #1] feat: プロジェクトセットアップを完了"
git push -u origin feature/issue-1
gh pr create --title "..." --body "..."
# PRをマージ

# Issue #2の実装
git checkout main
git pull origin main
git checkout -b feature/issue-2
# ... 実装 ...
git add .
git commit -m "[Issue #2] feat: データベースセットアップを完了"
git push -u origin feature/issue-2
gh pr create --title "..." --body "..."
# PRをマージ
```

### ステップ2: Phase 2の並列実装（3インスタンス同時）

**重要**: 3つの独立したターミナル/Claude Codeインスタンスを起動し、**同時に**作業を開始します。

#### インスタンスA（Issue #3）

```bash
git checkout main
git pull origin main
git checkout -b feature/issue-3
# ... ユーザー管理機能を実装 ...
# src/routes/index.js に users ルートを追加
git add .
git commit -m "[Issue #3] feat: ユーザー管理機能を実装"
git push -u origin feature/issue-3
gh pr create --title "[Phase 2-A] ユーザー管理機能" --body "..."
```

#### インスタンスB（Issue #4）

```bash
git checkout main
git pull origin main
git checkout -b feature/issue-4
# ... タスクCRUD機能を実装 ...
# src/routes/index.js に tasks ルートを追加
git add .
git commit -m "[Issue #4] feat: タスクCRUD機能を実装"
git push -u origin feature/issue-4
gh pr create --title "[Phase 2-A] タスクCRUD機能（基本）" --body "..."
```

#### インスタンスC（Issue #5）

```bash
git checkout main
git pull origin main
git checkout -b feature/issue-5
# ... コメント機能を実装 ...
# src/routes/index.js に comments ルートを追加
git add .
git commit -m "[Issue #5] feat: コメント機能を実装"
git push -u origin feature/issue-5
gh pr create --title "[Phase 2-A] コメント機能" --body "..."
```

### ステップ3: マージコンフリクトの解決

最初のPR（例: #3）をマージした後、残りのPR（#4、#5）で競合が発生します。

#### 競合解決例（Issue #4のブランチで）

```bash
# mainブランチの最新を取得
git checkout feature/issue-4
git fetch origin main

# rebaseでmainを取り込む
git rebase origin/main

# 競合が発生（src/routes/index.js）
# エディタで競合を解決：
# - Issue #3 のusersルート
# - Issue #4 のtasksルート
# 両方を保持する形で統合

git add src/routes/index.js
git rebase --continue

# テストを実行して問題ないことを確認
npm test
npm run lint

# プッシュ
git push origin feature/issue-4 --force-with-lease
```

### ステップ4: Phase 3の並列実装（3インスタンス同時）

Phase 2が完了したら、同様の手順でPhase 3を実施します。

### ステップ5: Phase 4の実装

すべての機能が実装された後、仕上げのIssueを実装します。

---

## 競合ファイルとその解決方針

### 1. `src/routes/index.js`（最頻出の競合）

**競合パターン**:

```javascript
// <<<<<<< HEAD (既存)
router.use('/users', usersRoutes);
// =======
router.use('/tasks', tasksRoutes);
// >>>>>>> feature/issue-4
```

**解決方針**:

```javascript
// 両方を保持
router.use('/users', usersRoutes);
router.use('/tasks', tasksRoutes);
router.use('/comments', commentsRoutes);
router.use('/stats', statsRoutes);
```

### 2. `src/services/taskService.js`（部分的な競合）

**競合パターン**:

```javascript
// Issue #6 がフィルタリング関数を追加
// Issue #7 が割り当て関数を追加
```

**解決方針**:

- 異なる関数なら両方を保持
- 同じ関数を変更している場合は、両方の変更を統合

### 3. `package.json`

**競合パターン**:

```json
"dependencies": {
  "express": "^4.18.0",
  // <<<<<<< HEAD
  "bcrypt": "^5.1.0"
  // =======
  "express-validator": "^7.0.0"
  // >>>>>>>
}
```

**解決方針**:

```json
"dependencies": {
  "express": "^4.18.0",
  "bcrypt": "^5.1.0",
  "express-validator": "^7.0.0"
}
```

### 4. `README.md`

**解決方針**:

- 各セクションを統合
- 重複する内容は1つにまとめる
- 情報は追加の形で統合

---

## 検証ポイント

並列開発検証の際、以下のポイントを記録してください：

### 1. 競合発生箇所

- [ ] どのファイルで競合が発生したか
- [ ] 予想通りの競合だったか
- [ ] 予想外の競合があったか

### 2. 競合解決の容易さ

- [ ] 解決にかかった時間
- [ ] 手動での調整が必要だったか
- [ ] 自動マージできたか

### 3. テスト結果

- [ ] 競合解決後のテスト成功率
- [ ] リグレッションの有無
- [ ] カバレッジの維持

### 4. ブランチ戦略の有効性

- [ ] feature/issue-{番号}の命名規則は有効だったか
- [ ] rebase vs merge どちらが適切だったか
- [ ] こまめなpull/rebaseは役立ったか

---

## マージ順序の推奨

### Phase 2（並列グループA）

1. Issue #3（ユーザー管理）を最初にマージ
2. Issue #4（タスクCRUD）を次にマージ（#3との競合を解決）
3. Issue #5（コメント）を最後にマージ（#3、#4との競合を解決）

**理由**: ユーザーとタスクは他の機能の基盤となるため、早めにマージ

### Phase 3（並列グループB）

1. Issue #6（フィルタリング）を最初にマージ
2. Issue #7（割り当て）を次にマージ（#6との競合可能性）
3. Issue #8（統計）を最後にマージ

---

## トラブルシューティング

### 問題1: テスト失敗

**原因**: 競合解決時にコードが壊れた

**解決**:

```bash
# テスト実行
npm test

# エラー箇所を特定
# コードを修正
git add .
git commit -m "[Issue #X] fix: 競合解決後のテスト修正"
```

### 問題2: リンターエラー

**原因**: 異なるフォーマットのコードがマージされた

**解決**:

```bash
# フォーマット実行
npm run format

# リンター確認
npm run lint

# 修正をコミット
git add .
git commit -m "[Issue #X] chore: リンター修正"
```

### 問題3: データベーススキーマの不一致

**原因**: 複数のIssueがスキーマを変更

**解決**:

```bash
# データベースをリセット
npm run db:reset

# 再初期化
npm run db:init

# テスト実行
npm test
```

---

## チェックリスト

### 開始前

- [ ] すべてのIssueを読んで理解している
- [ ] ブランチ戦略を理解している
- [ ] 競合ポイントを把握している
- [ ] 3つのターミナルを準備している

### Phase 2実施時

- [ ] 3つのインスタンスで同時に作業を開始した
- [ ] 各自が`src/routes/index.js`を変更した
- [ ] 最初のPRをマージした
- [ ] 残りのPRで競合が発生した
- [ ] 競合を解決した
- [ ] テストが成功した

### Phase 3実施時

- [ ] Phase 2の経験を活かした
- [ ] 競合解決がスムーズになった
- [ ] すべてのPRがマージされた

### 完了時

- [ ] 10個すべてのIssueが完了した
- [ ] すべてのテストが成功している
- [ ] リンターが通っている
- [ ] 並列開発検証レポートを作成した

---

## 期待される学び

この並列開発検証を通じて、以下を学ぶことができます：

1. **マージコンフリクトの予測**: どのファイルが競合しやすいかを事前に把握する能力
2. **効果的なブランチ戦略**: feature/{issue-number}の命名規則の有効性
3. **コンフリクト解決スキル**: rebase/mergeの使い分け、競合の解決方法
4. **テスト駆動開発**: 競合解決後のテストの重要性
5. **コミュニケーション**: 複数開発者（インスタンス）間での調整の必要性

---

**作成日**: 2026-02-06
**対象プロジェクト**: task-management-api
**検証目的**: Claude Codeによる並列開発の可能性検証
