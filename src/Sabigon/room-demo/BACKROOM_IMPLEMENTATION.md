# Backroom Noclip システム - 実装ガイド

## 概要
このプロジェクトには、Backroomsのnoclipイベントシステムが実装されています。
プレイヤーが迷路内を移動中に、低確率でBackroom Level0に転送されます。

## 実装されている機能

### 1. Noclip判定システム (`NoclipEvent.jsx`)
- **NoclipManager クラス**: 一歩歩くごとにnoclip発生を判定
  - デフォルト確率: 5% (デバッグ用)
  - 本番推奨確率: 0.1% (0.001)
  - `checkNoclip()`: 移動ごとに呼ばれ、noclipが発生したかを返す
  - `reset()`: Backroomから脱出時にリセット

### 2. ローディング画面 (`NoclipEvent.jsx`)
- **NoclipLoadingScreen コンポーネント**
  - グリッチエフェクト付きのローディング画面
  - プログレスバーのアニメーション
  - 黄色の警告色とBackrooms風のスタイル

### 3. Backroom Level0 (`BackroomLevel0.jsx`)
- **独自の迷路生成** (`backroomGenerator.js`)
  - 通常の迷路とは異なる、開けた空間
  - ランダムに壁を配置 (15%の確率)
  - バックルーム特有の不気味な雰囲気
- **PBRテクスチャの使用**
  - 床: カーペットテクスチャ (color, normal, roughness)
  - 壁: 壁紙テクスチャ (color, normal, roughness)
  - 天井: 天井タイルテクスチャ (color, normal, roughness)
- **脱出ポイント**: 青白く光る球体
- **移動速度**: 通常の迷路より少し遅く設定

### 4. Game.jsx の統合
- **ゲームステート管理**
  - `"normal"`: 通常の迷路ゲーム
  - `"noclip-loading"`: noclip発生時のローディング
  - `"backroom"`: Backroom Level0に転送

## 今後の実装予定

### 敵の配置 (実装準備済み)

#### backroomGenerator.js
```javascript
export function getEnemySpawnPositions(maze, count = 3)
```
- 敵の初期配置位置を取得する関数
- 既にBackroomLevel0.jsxで呼び出し済み

#### 実装ステップ
1. `components/Enemy.jsx` を作成
2. 敵のモデル/メッシュを作成
3. 敵のAI (追跡アルゴリズム)
4. プレイヤーとの当たり判定
5. BackroomLevel0.jsxの`EnemyPlaceholder`を置き換え

```jsx
// 実装例
{enemyPositions.map((pos, i) => (
  <Enemy 
    key={i} 
    position={[pos[0] * wallSize, 1, pos[1] * wallSize]}
    onCatch={handlePlayerCaught}
  />
))}
```

### ジャンプスケアシステム (実装準備済み)

#### backroomGenerator.js
```javascript
export function getJumpScareTriggers(maze, count = 5)
```
- ジャンプスケアのトリガー位置を取得
- コメントアウトされているが、簡単に有効化可能

#### 実装ステップ
1. `components/JumpScare.jsx` を作成
2. ジャンプスケア画像/動画の準備
3. トリガー判定ロジック (プレイヤーがトリガー位置に近づいたら発動)
4. BackroomLevel0.jsxのPlayerControlsに判定を追加

```jsx
// BackroomPlayerControls内に追加
function checkJumpScareTriggers(playerPos, triggers, wallSize) {
  for (const [tx, ty] of triggers) {
    const triggerX = tx * wallSize;
    const triggerZ = ty * wallSize;
    const dx = playerPos.x - triggerX;
    const dz = playerPos.z - triggerZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < 2.0) { // トリガー範囲
      return true; // ジャンプスケア発動
    }
  }
  return false;
}
```

### サウンドエフェクト
- **通常迷路**: 足音、環境音
- **Noclip時**: グリッチサウンド
- **Backroom Level0**: 蛍光灯のノイズ、不気味な環境音
- **敵**: 追跡時の音、ジャンプスケア時の音

### 追加レベル (Level1, Level2など)
現在のシステムを拡張して、複数のBackroomレベルを実装可能:
1. `BackroomLevel1.jsx`, `BackroomLevel2.jsx` を作成
2. レベル間の遷移ロジック
3. 各レベル固有の特徴と敵

## ファイル構造

```
src/
├── mazeGenerator.js          # 通常の迷路生成
├── backroomGenerator.js      # Backroom Level0の生成
└── components/
    ├── Game.jsx              # メインゲームロジック (noclip統合済み)
    ├── NoclipEvent.jsx       # Noclip判定とローディング画面
    ├── BackroomLevel0.jsx    # Backroom Level0の3D環境
    ├── StartScreen.jsx       # スタート画面
    ├── ResultScreen.jsx      # リザルト画面
    └── PlayerControls.jsx    # プレイヤー操作 (旧版)
```

## 設定の調整

### Noclip確率の変更
`src/components/NoclipEvent.jsx` の `NoclipManager` コンストラクタ:
```javascript
this.noclipProbability = 0.05;  // 5% (デバッグ用)
// this.noclipProbability = 0.001; // 0.1% (本番推奨)
```

### Backroomの広さ
`src/components/BackroomLevel0.jsx`:
```javascript
const mazeWidth = 31;  // 幅を変更
const mazeHeight = 31; // 高さを変更
```

### 壁の配置密度
`src/backroomGenerator.js`:
```javascript
else if (Math.random() < 0.15) {  // 15%の確率で壁を配置
  maze[y][x] = 1;
}
```

## テクスチャの使用

Backroom Level0では以下のPBRテクスチャを使用しています:

### 床 (カーペット)
```
/textures/backrooms/carpet/
├── carpet_color.png      # ベースカラー
├── carpet_normal.png     # 法線マップ
└── carpet_rough.png      # ラフネスマップ
```

### 壁 (壁紙)
```
/textures/backrooms/wallpaper/
├── wallpaper_color.png   # ベースカラー
├── wallpaper_normal.png  # 法線マップ
└── wallpaper_rough.png   # ラフネスマップ
```

### 天井 (天井タイル)
```
/textures/backrooms/ceiling_tiles/
├── ceiling_tiles_color.png   # ベースカラー
├── ceiling_tiles_normal.png  # 法線マップ
└── ceiling_tiles_rough.png   # ラフネスマップ
```

### 利用可能なその他のテクスチャ

今後の拡張のために、以下のテクスチャも利用可能です:
- `ceiling_tiles_2/` - 別の天井タイルデザイン
- `painted_wall/` - 塗装された壁
- `painted_wall_2/` - 別の塗装壁デザイン
- `pool_tiles/` - プールタイル (height mapも含む)

## テクスチャの追加 (オプション)

## テクスチャの変更方法

異なるBackroomテクスチャを使用したい場合、`BackroomLevel0.jsx`で以下のように変更します:

### 例: 塗装された壁を使用する場合
```javascript
// 壁紙の代わりに塗装壁を使用
const wallpaperColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/painted_wall/painted_wall_color.png");
const wallpaperNormalMap = useLoader(THREE.TextureLoader, "/textures/backrooms/painted_wall/painted_wall_normal.png");
const wallpaperRoughnessMap = useLoader(THREE.TextureLoader, "/textures/backrooms/painted_wall/painted_wall_rough.png");
```

Backroom専用のテクスチャを追加する場合:
```
public/textures/backrooms/
├── carpet/
│   └── carpet.jpg
├── wallpaper/
│   └── wallpaper.jpg
└── ceiling_tiles/
    └── ceiling.jpg
```

`BackroomLevel0.jsx` で読み込み:
```javascript
const floorTexture = useLoader(THREE.TextureLoader, "/textures/backrooms/carpet/carpet.jpg");
```

## デバッグ情報

Game.jsx内のUI表示を変更することで、デバッグ情報を追加できます:
```jsx
<p>Steps: {noclipManager.getStepCount()}</p>
<p>Game State: {gameState}</p>
```

## 既知の制約事項

1. ~~**テクスチャ**: 現在は通常の迷路と同じテクスチャを使用~~ ✅ 実装済み (PBRテクスチャ使用)
2. **敵**: プレースホルダーのみ (実装待ち)
3. **ジャンプスケア**: 関数は準備済みだが未実装
4. **サウンド**: 未実装

## 今後の拡張性

- ✅ 敵の配置システム準備済み
- ✅ ジャンプスケアのトリガーシステム準備済み
- ✅ レベル間の遷移システム (ゲームステート管理で対応可能)
- ⏳ サウンドシステム
- ⏳ マルチプレイヤー対応
