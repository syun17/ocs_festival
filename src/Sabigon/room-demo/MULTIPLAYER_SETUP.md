# マルチプレイ実装完了 🎮

## 概要
Backroomsゲームにマルチプレイ機能を実装しました。最大2人で協力してBackroomsから脱出できます。

## 📦 必要なパッケージのインストール

```powershell
npm install @react-three/drei
```

## 🚀 サーバーの起動

別のターミナルでWebSocketサーバーを起動してください:

```powershell
node server.cjs
```

サーバーが起動すると、以下のメッセージが表示されます:
```
🚀 WebSocket server running on ws://localhost:8080
```

## 🎮 遊び方

### 1. ゲームを起動
```powershell
npm run dev
```

### 2. ホストプレイヤー（1人目）
1. ブラウザでゲームを開く
2. 「👥 マルチプレイ」をクリック
3. 「🏠 ルームを作成」を選択
4. プレイヤー名を入力
5. 「ルーム作成」をクリック
6. **表示された4桁のルームIDをゲストに共有**

### 3. ゲストプレイヤー（2人目）
1. 別のブラウザタブまたは別のPCでゲームを開く
2. 「👥 マルチプレイ」をクリック
3. 「👥 ルームに参加」を選択
4. プレイヤー名を入力
5. ホストから受け取った4桁のルームIDを入力
6. 「参加」をクリック

### 4. 協力プレイ
- 2人とも同じBackroomsの世界に入ります
- お互いの位置がリアルタイムで表示されます
- 協力してゴールを目指しましょう！

## 🎯 実装された機能

### フロントエンド
- ✅ **MultiplayerLobby.jsx** - ルーム作成・参加UI
- ✅ **MultiplayerManager.jsx** - WebSocket通信管理
- ✅ **OtherPlayer.jsx** - 他プレイヤーの3D表示
- ✅ **BackroomLevelRun.jsx** - マルチプレイ対応
- ✅ **StartScreen.jsx** - シングル/マルチ選択画面

### バックエンド
- ✅ **server.cjs** - WebSocketサーバー（既存）
  - ルーム作成機能
  - ルーム参加機能（4桁ID）
  - リアルタイム位置同期
  - 最大2人まで対応

## 🔧 技術仕様

### サーバー通信プロトコル

#### クライアント → サーバー

**ルーム作成:**
```json
{
  "type": "create-room"
}
```

**ルーム参加:**
```json
{
  "type": "join-room",
  "roomId": "1234"
}
```

**位置更新:**
```json
{
  "type": "update",
  "position": {
    "x": 10.5,
    "y": 1.6,
    "z": 20.3
  }
}
```

#### サーバー → クライアント

**ルーム作成完了:**
```json
{
  "type": "room-created",
  "roomId": "1234",
  "playerId": "abc123"
}
```

**ルーム参加完了:**
```json
{
  "type": "room-joined",
  "roomId": "1234",
  "playerId": "def456"
}
```

**プレイヤー状態:**
```json
{
  "type": "state",
  "players": [
    {
      "id": "abc123",
      "position": { "x": 10, "y": 1.6, "z": 20 }
    },
    {
      "id": "def456",
      "position": { "x": 12, "y": 1.6, "z": 25 }
    }
  ]
}
```

**エラー:**
```json
{
  "type": "error",
  "message": "Room not found"
}
```

## 🎨 画面表示

ゲーム中、画面左上に以下の情報が表示されます:

```
🚨 LEVEL ! - RUN FOR YOUR LIFE! 🚨
前方へ逃げろ! WASD移動、マウス視点
ゴールまで: 180m
⚠️ 後ろを振り返るな!

┌─────────────────────────┐
│ 👥 マルチプレイモード    │
│ ルームID: 1234          │
│ プレイヤー: Player1     │
│ 接続中: 1人             │
└─────────────────────────┘
```

## 🐛 トラブルシューティング

### サーバーに接続できない
- `server.cjs`が起動しているか確認
- ポート8080が使用可能か確認
- ブラウザのコンソールでエラーを確認

### ルームが見つからない
- 4桁のルームIDが正しいか確認
- ホストが先にルームを作成しているか確認
- サーバーログで確認: `Room not found`

### 他プレイヤーが表示されない
- 両方のプレイヤーが同じルームIDに接続しているか確認
- ブラウザのコンソールで`[MultiplayerManager]`のログを確認
- サーバーログで両プレイヤーの接続状態を確認

### プレイヤーモデルが表示されない
- `@react-three/drei`がインストールされているか確認
- テクスチャファイルが正しい場所にあるか確認:
  - `/public/textures/backrooms/player/scene.gltf`
  - `/public/textures/backrooms/player/textures/Material.001_baseColor.jpeg`

## 📁 ファイル構成

```
src/
├── components/
│   ├── MultiplayerLobby.jsx       # ロビー画面
│   ├── MultiplayerManager.jsx     # WebSocket通信
│   ├── OtherPlayer.jsx            # 他プレイヤー表示
│   ├── BackroomLevelRun.jsx       # マルチプレイ対応ゲーム
│   ├── StartScreen.jsx            # スタート画面
│   ├── Game.jsx                   # ゲームコントローラー
│   └── ...
└── App.jsx                         # メインアプリ

server.cjs                          # WebSocketサーバー

public/
└── textures/
    └── backrooms/
        └── player/
            ├── scene.gltf
            ├── scene.bin
            └── textures/
                └── Material.001_baseColor.jpeg
```

## 🎉 完了!

これでマルチプレイ機能が使えるようになりました！
2人で協力してBackroomsから脱出しましょう！
