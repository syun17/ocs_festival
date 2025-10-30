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

### 2. Noclip落下演出 (`NoclipFalling3D.jsx`)
- **3D空間での落下アニメーション**
  - カメラが実際に落下（2秒間）
  - 加速度的に落下速度が上がる
  - カメラの回転エフェクト
  - パーティクルが上昇して落下感を演出
  - グリッチエフェクト（赤と黄色のライト）
  - ワイヤーフレームのボックスが浮遊
  - 壁のような構造物が周囲に配置
  - "NO CLIP"テキストのグリッチ表示

### 3. ローディング画面 (`NoclipEvent.jsx`)
- **NoclipLoadingScreen コンポーネント**
  - グリッチエフェクト付きのローディング画面
  - プログレスバーのアニメーション
  - 黄色の警告色とBackrooms風のスタイル

### 4. VHSエフェクト (`VHSEffect.jsx`)
- **レトロなVHS/CRT画面エフェクト**
  - VCRトラッキングノイズ: ビデオテープの劣化を再現
  - スノーノイズ: CRT画面のノイズ
  - スキャンライン: ブラウン管テレビの走査線
  - ビネット効果: 画面周辺の暗転
  - 画面の揺れ: 不安定なビデオ信号を再現
- **動的レンダリング**
  - Canvas APIを使用したリアルタイムノイズ生成
  - 60FPSでスムーズなアニメーション
  - レスポンシブ対応

### 4. Backroom Level0 環境
- **独自の迷路生成** (`backroomGenerator.js`)
  - 通常の迷路とは異なる、開けた空間
  - ランダムに壁を配置 (15%の確率)
  - バックルーム特有の不気味な雰囲気
- **VHS/CRTエフェクト** (`VHSEffect.jsx`)
  - VCRトラッキングノイズ
  - スノーノイズ（CRT画面のノイズ）
  - スキャンライン
  - ビネット効果
  - 画面の揺れエフェクト
- **PBRテクスチャの使用**
  - 床: カーペットテクスチャ (color, normal, roughness)
  - 壁: 壁紙テクスチャ (color, normal, roughness)
  - 天井: 天井タイルテクスチャ (color, normal, roughness)
- **脱出ドア**: 木製のドア、ドアノブ、光るサイン
- **ゲームクリア**: ドアから脱出するとゲームクリア
- **移動速度**: 通常の迷路より少し遅く設定

### 4. Game.jsx の統合
- **ゲームステート管理**
  - `"normal"`: 通常の迷路ゲーム
  - `"noclip-falling"`: noclip発生時の落下演出（3D）
  - `"noclip-loading"`: 落下後のローディング
  - `"backroom"`: Backroom Level0に転送
- **ゲームクリア条件**
  - 通常迷路: ゴール到達
  - Backroom: 脱出ドアから脱出

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
├── effect/
│   ├── vhs-effect.css        # VHSエフェクト用スタイル
│   ├── screeneffect.js       # (参考) オリジナルVHSエフェクト
│   └── screeneffect.css      # (参考) オリジナルスタイル
└── components/
    ├── Game.jsx              # メインゲームロジック (noclip統合済み)
    ├── NoclipEvent.jsx       # Noclip判定とローディング画面
    ├── NoclipFalling3D.jsx   # 3D落下演出
    ├── VHSEffect.jsx         # VHS/CRTエフェクトコンポーネント
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
2. ~~**VHSエフェクト**: 未実装~~ ✅ 実装済み (VCRノイズ、スキャンライン等)
3. ~~**脱出ポイント**: 球体のみ~~ ✅ 実装済み (ドアモデル)
4. **敵**: プレースホルダーのみ (実装待ち)
5. **ジャンプスケア**: 関数は準備済みだが未実装
6. **サウンド**: 未実装

## 今後の拡張性

- ✅ 敵の配置システム準備済み
- ✅ ジャンプスケアのトリガーシステム準備済み
- ✅ レベル間の遷移システム (ゲームステート管理で対応可能)
- ✅ VHSエフェクト実装済み
- ✅ 脱出ドア実装済み
- ✅ 落下演出（3D）実装済み
- ⏳ サウンドシステム
- ⏳ マルチプレイヤー対応

## Noclip落下演出の技術詳細

### 演出の流れ
1. **noclip発生検知** - プレイヤーが一定距離移動するたびに判定
2. **3D落下開始** - `NoclipFalling3D`コンポーネントに遷移
3. **落下アニメーション（2秒間）**
   - カメラが下方向に加速度的に落下
   - カメラが回転（Z軸とX軸）
   - パーティクルが上昇して落下感を強調
4. **ローディング画面** - 落下完了後、`NoclipLoadingScreen`に遷移
5. **Backroom転送** - ローディング完了後、Level0へ

### 3D落下演出の要素

#### カメラの動き
```javascript
const fallSpeed = elapsed * elapsed * 5; // 二次関数的に加速
camera.position.y = initialY - fallSpeed;
camera.rotation.z = elapsed * Math.PI;    // Z軸回転
camera.rotation.x = -Math.PI/4 + elapsed * 0.5; // X軸回転
```

#### 視覚エフェクト
- **パーティクル（1000個）**: 上方向に移動し、落下感を演出
- **グリッチライト**: 赤と黄色のポイントライト
- **壁構造**: 8枚の半透明な壁が円形に配置
- **ワイヤーフレームボックス**: 20個のランダムな位置に配置
- **"NO CLIP"テキスト**: グリッチエフェクト付き

### カスタマイズ方法

**落下時間の変更** (`NoclipFalling3D.jsx`):
```javascript
if (elapsed < 2) { // ← ここを変更（秒数）
  // 落下アニメーション
}
```

**落下速度の調整**:
```javascript
const fallSpeed = elapsed * elapsed * 5; // ← 最後の数値を変更
```

**パーティクル数の変更**:
```javascript
const particleCount = 1000; // ← 個数を変更
```

## VHSエフェクトの技術詳細

### エフェクトの構成
1. **VCRトラッキングノイズ**
   - 白いノイズラインがランダムに表示
   - ビデオテープの劣化や追跡エラーを再現
   
2. **スノーノイズ**
   - Canvas APIでランダムなピクセルノイズを生成
   - CRT画面の静電ノイズを再現
   
3. **スキャンライン**
   - CSSグラデーションで走査線を表現
   - ブラウン管テレビの特徴的な横線
   
4. **ビネット効果**
   - 画面周辺を暗くする
   - 古いカメラやモニターの特徴

5. **画面の揺れ**
   - CSSアニメーションで微細な振動
   - 不安定なビデオ信号を表現

### カスタマイズ方法

`VHSEffect.jsx`内のconfig値を変更:
```javascript
const config = {
  miny: 220,      // トラッキングノイズの開始位置
  maxy: height,   // トラッキングノイズの終了位置
  miny2: 220,     // 下部のノイズ位置
  num: 70,        // ノイズの密度（テープの劣化度）
  blur: 1         // ブラー強度
};
```

スノーノイズの透明度を変更 (`vhs-effect.css`):
```css
canvas.snow {
  opacity: 0.2; /* 0.0 - 1.0 */
}
```
