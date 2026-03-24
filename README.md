# TempVoice

Discord 一時ボイスチャンネル Bot。
**マスターチャンネル**に参加すると自動で一時VCが作成され、全員が退出すると自動で削除されます。

---

## 機能

- **一時VC自動作成/削除** — マスターチャンネル参加で専用VCを作成、空になると削除
- **テキストチャンネル連携** — 各一時VCに専用テキストチャンネルを作成（VC参加者のみ閲覧可）
- **ボタンパネル** — テキストチャンネルに操作パネルを自動送信
- **スラッシュコマンド** — オーナー向け各種操作コマンドを提供
- **権限管理** — ロック/非公開/BANを組み合わせた一元的な権限制御
- **Bot再起動復旧** — 起動時に孤立したDBレコードを自動クリーンアップ

---

## 必要環境

- **Node.js** v22.5.0 以上（`node:sqlite` 組み込みモジュールを使用）
- **Discord Bot** — [Discord Developer Portal](https://discord.com/developers/applications) で作成

---

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd tempvoice
```

### 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を編集して以下を設定：

```env
DISCORD_TOKEN=your_bot_token_here   # Bot トークン
CLIENT_ID=your_application_client_id_here  # アプリケーション ID
GUILD_ID=                           # 開発用: ギルドIDを設定で即時反映（本番は空欄）
DATA_DIR=./data                     # SQLite 保存先（省略可）
```

### 3. 依存パッケージのインストール

```bash
npm install
```

### 4. スラッシュコマンドの登録

```bash
npm run deploy
```

> `GUILD_ID` を設定するとギルド単位で即時反映。空欄だとグローバル登録（最大1時間かかる）。

### 5. Bot の起動

```bash
npm start          # 本番
npm run dev        # 開発（ホットリロード）
```

---

## Docker での起動

```bash
cp .env.example .env
# .env を編集

docker compose up -d       # バックグラウンドで起動
docker compose logs -f     # ログを確認
docker compose down        # 停止
```

SQLite データは `bot_data` という名前付きボリューム（`/data`）に永続化されます。

---

## Bot の権限設定

Discord Developer Portal でBotに以下のスコープと権限を付与してください。

**OAuth2 スコープ**: `bot`, `applications.commands`

**Bot 権限**:
- Manage Channels（チャンネル管理）
- Move Members（メンバー移動）
- Manage Roles（ロール管理）
- Read Messages / View Channels
- Send Messages
- Embed Links

---

## コマンド一覧

### 管理者コマンド

| コマンド | 説明 |
|---|---|
| `/setup create` | 新規マスターチャンネルを作成して登録 |
| `/setup register` | 既存のVCをマスターチャンネルとして登録 |
| `/masterlist` | 登録済みマスターチャンネルの一覧表示 |
| `/settemplate <template>` | チャンネル名テンプレートを設定（`%owner%`, `%counter%` が使用可） |
| `/setcategory <category>` | 一時VC作成先のカテゴリを設定 |

### オーナーコマンド（一時VCオーナーのみ）

| コマンド | 説明 |
|---|---|
| `/rename <name>` | チャンネル名を変更 |
| `/limit <number>` | 人数制限を設定（0で無制限） |
| `/bitrate <kbps>` | ビットレートを設定 |
| `/lock` / `/unlock` | VC をロック/アンロック（参加不可/可） |
| `/private` / `/public` | VCを非公開/公開に切り替え（非表示も兼ねる） |
| `/kick <user>` | 指定ユーザーをVCから退出させる |
| `/ban <user>` | 指定ユーザーのVC参加を禁止 |
| `/invite <user>` | 非公開VCにユーザーを招待 |
| `/claim` | オーナー不在のVCをクレーム（オーナー権取得） |
| `/transfer <user>` | VCのオーナー権を他のユーザーに譲渡 |

### ボタンパネル

テキストチャンネルに自動送信されるパネル（2行 × 5ボタン）からも操作可能：

| ボタン | 説明 |
|---|---|
| 🔒 ロック | チャンネルのロック切り替え |
| 🔐 非公開/公開 | 非公開/公開切り替え（非表示も兼ねる） |
| ✏️ 名前変更 | モーダルでチャンネル名を変更 |
| 👥 人数制限 | モーダルで人数制限を設定 |
| 📡 ビットレート | モーダルでビットレートを設定 |
| 👢 キック | ユーザーを選択してキック |
| 🚫 BAN | ユーザーを選択してBAN |
| 📨 招待 | ユーザーを選択して招待 |
| 🏳️ クレーム | オーナー不在時に所有権を取得 |
| 🔄 移譲 | ユーザーを選択してオーナー権を譲渡 |

## カスタマイズ（config.js）

[src/config.js](src/config.js) を編集することで、ボット内のすべてのテキストを変更できます。

### テキストチャンネル名テンプレート

```js
panel: {
  textChannelTemplate: 'vc-{vcname}',  // デフォルト
}
```

使用できるプレースホルダー：

| 変数 | 展開内容 |
|---|---|
| `{vcname}` | 作成されたVCの名前 |
| `{owner}` | オーナーの表示名 |
| `{counter}` | ギルド内の連番 |

### ボタンラベル・絵文字

```js
buttons: {
  lock: { label: 'ロック', emoji: '🔒' },
  // ... 各ボタンをカスタマイズ可能
}
```

### モーダルのタイトル・入力ラベル

```js
modals: {
  rename: { title: 'チャンネル名を変更', inputLabel: '新しいチャンネル名', placeholder: '例: みんなの部屋' },
  // ...
}
```

### 応答メッセージ

```js
messages: {
  locked: '🔒 チャンネルをロックしました。',
  // ... すべての応答メッセージを変更可能
}
```

---

## チャンネル名テンプレート

`/settemplate` で以下の変数が使用可能：

| 変数 | 展開内容 |
|---|---|
| `%owner%` | オーナーの表示名 |
| `%counter%` | ギルド内の連番 |

例: `%owner%のチャンネル #%counter%` → `山田のチャンネル #3`

---

## ファイル構成

```
src/
  index.js              # クライアント初期化・イベント/コマンド自動ロード
  deploy-commands.js    # スラッシュコマンド登録
  config.js             # メッセージ・ボタン・モーダル・テンプレートの設定
  database/
    db.js               # SQLite 初期化・スキーマ定義・マイグレーション
    index.js            # 互換性再エクスポート
  database.js           # DBヘルパー（プリコンパイル済みステートメント）
  events/
    ready.js            # 起動時の孤立レコードクリーンアップ
    voiceStateUpdate.js # VC作成/削除のコアロジック
    interactionCreate.js# コマンド・ボタン・モーダル・セレクトメニューのルーティング
  utils/
    checks.js           # オーナー検証ヘルパー
    panel.js            # ボタンパネル生成（2行×5ボタン）
    permissions.js      # 権限一元管理 (applyVCPermissions / syncTextChannel)
    tempChannel.js      # 一時VC作成/削除（作成ロック含む）
  commands/
    admin/              # setup, masterlist, settemplate, setcategory
    owner/              # rename, limit, bitrate, lock, unlock, private,
                        # public, kick, ban, invite, claim, transfer
```

---

## 技術スタック

| 項目 | 内容 |
|---|---|
| ランタイム | Node.js ≥ 22.5.0 |
| Discord | discord.js v14 |
| データベース | SQLite（`node:sqlite` 組み込みモジュール） |
| コンテナ | Docker + docker-compose |
