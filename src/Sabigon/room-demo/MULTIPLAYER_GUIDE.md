# マルチプレイ対応 - 実装ガイド

## 概要
BackroomLevelRunコンポーネントにマルチプレイヤー機能を追加しました。他のプレイヤーが3Dモデルで表示されます。

## 追加されたコンポーネント

### 1. OtherPlayer.jsx
他プレイヤーを3D空間に表示するコンポーネントです。

**機能:**
- GLTFモデル (`/textures/backrooms/player/scene.gltf`) の読み込み
- テクスチャ (`/textures/backrooms/player/textures/Material.001_baseColor.jpeg`) の適用
- スムーズな位置・回転の補間
- プレイヤー名の表示

**Props:**
- `position`: [x, y, z] - プレイヤーの位置
- `rotation`: number - Y軸の回転（ラジアン）
- `playerName`: string - 表示する名前

### 2. MultiplayerManager.jsx
WebSocketを使って他プレイヤーとの通信を管理するコンポーネントです。

**機能:**
- WebSocket接続の確立と維持
- 自分の位置情報を定期的にサーバーへ送信（100msごと）
- 他プレイヤーの位置情報を受信して更新
- 自動再接続機能

**Props:**
- `serverUrl`: string - WebSocketサーバーのURL (例: "ws://localhost:8080")
- `playerPosition`: object - 自分の位置と回転 `{ position: [x, y, z], rotation: number }`
- `onPlayersUpdate`: function - 他プレイヤーのデータが更新されたときのコールバック

## 使用方法

### BackroomLevelRun.jsxでの統合例

```jsx
import MultiplayerManager from "./MultiplayerManager";
import OtherPlayer from "./OtherPlayer";

export default function BackroomLevelRun({ onEscape, onGameOver }) {
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [playerRotation, setPlayerRotation] = useState(0);

  return (
    <>
      <VHSEffect intensity={0.8}>
        <Canvas>
          {/* 環境とエンティティ */}
          <HospitalEnvironment />
          
          {/* 他プレイヤーの表示 */}
          {otherPlayers.map((player) => (
            <OtherPlayer
              key={player.id}
              position={player.position}
              rotation={player.rotation}
              playerName={player.name}
            />
          ))}
          
          <HospitalPlayerControls 
            onPositionUpdate={(pos, rot) => {
              setPlayerPosition(pos);
              setPlayerRotation(rot);
            }}
          />
        </Canvas>
      </VHSEffect>
      
      {/* マルチプレイヤー通信マネージャー */}
      <MultiplayerManager
        serverUrl="ws://localhost:8080"
        playerPosition={{ 
          position: playerPosition, 
          rotation: playerRotation 
        }}
        onPlayersUpdate={setOtherPlayers}
      />
    </>
  );
}
```

## サーバー側の実装

WebSocketサーバーは以下のメッセージ形式に対応する必要があります:

### クライアント → サーバー

**接続時:**
```json
{
  "type": "join"
}
```

**位置更新:**
```json
{
  "type": "playerUpdate",
  "playerId": "player123",
  "position": [x, y, z],
  "rotation": 1.57,
  "timestamp": 1234567890
}
```

### サーバー → クライアント

**接続完了:**
```json
{
  "type": "welcome",
  "playerId": "player123"
}
```

**プレイヤーリスト更新:**
```json
{
  "type": "playersUpdate",
  "players": [
    {
      "id": "player123",
      "position": [10, 1.6, 20],
      "rotation": 0,
      "name": "Player 1"
    },
    {
      "id": "player456",
      "position": [12, 1.6, 25],
      "rotation": 1.57,
      "name": "Player 2"
    }
  ]
}
```

## サーバーサンプル (Node.js + ws)

```javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const players = new Map();

wss.on('connection', (ws) => {
  const playerId = generateUniqueId();
  
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    if (data.type === 'join') {
      // プレイヤーIDを送信
      ws.send(JSON.stringify({
        type: 'welcome',
        playerId: playerId
      }));
      
      players.set(playerId, {
        id: playerId,
        ws: ws,
        position: [0, 0, 0],
        rotation: 0,
        name: `Player ${players.size + 1}`
      });
    }
    
    if (data.type === 'playerUpdate') {
      // プレイヤーの位置を更新
      const player = players.get(data.playerId);
      if (player) {
        player.position = data.position;
        player.rotation = data.rotation;
      }
    }
  });
  
  ws.on('close', () => {
    players.delete(playerId);
  });
});

// 全クライアントに定期的にプレイヤーリストを送信
setInterval(() => {
  const playerList = Array.from(players.values()).map(p => ({
    id: p.id,
    position: p.position,
    rotation: p.rotation,
    name: p.name
  }));
  
  players.forEach(player => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'playersUpdate',
        players: playerList
      }));
    }
  });
}, 100);

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}
```

## テスト方法

1. WebSocketサーバーを起動
2. 複数のブラウザタブでゲームを開く
3. 各タブで移動すると、他のタブに自分のキャラクターが表示される

## 注意事項

- プレイヤーモデルのGLTFファイルとテクスチャが正しく配置されていることを確認してください
- WebSocketサーバーのURLは環境に応じて変更してください
- セキュリティを考慮する場合は、WSS（WebSocket Secure）を使用してください
- 大規模なマルチプレイの場合は、位置情報の送信頻度を調整してください
