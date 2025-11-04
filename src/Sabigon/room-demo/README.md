# Backrooms Escape Game

このプロジェクトは、React + Vite + three.js（@react-three/fiber, drei）を使ったBackrooms風ホラー脱出ゲームです。

## ゲームの流れ

### Phase 1: Normal Maze
- 通常の迷路を探索し、ゴールを目指す
- 壁に一定時間触れると「Noclip」が発生

### Phase 2: Noclip Event
- ブルースクリーン表示
- Backroomsへの落下演出
- ローディング画面

### Phase 3: Level 0 - The Backrooms
- 無限に続く黄色いオフィス空間
- 3体のエンティティから逃げながら脱出ドアを探す
- VHSノイズエフェクト

### Phase 4: Level ! - Run For Your Life!
- 病院風の廊下を一直線に走る
- 赤い緊急灯が点滅
- 8体のエンティティが後方から追跡
- 障害物（ベッド、医療カート、棚、車椅子）を避けながら進む
- ゴール地点到達でクリア

## 主な機能

- 3D空間内をWASDキーで移動
- Shiftキーで走る（速度アップ）
- マウスで視点操作（PointerLock対応）
- 壁との当たり判定あり
- リアルタイムの敵AI（徘徊・追跡モード）
- 複数のレベル遷移システム
- VHSエフェクト
- ブルースクリーンエフェクト
- 3D落下演出

## 操作方法

- **クリック**：マウスロック開始
- **W/A/S/D**：移動
- **Shift**：走る
- **マウス**：視点移動
- **Esc**：マウスロック解除

## 開発・実行

```bash
npm install
npm run dev
```

## 依存ライブラリ

- React
- Vite
- three.js
- @react-three/fiber
- @react-three/drei

## ディレクトリ構成例

```
maze-game/
├─ public/
│  └─ textures/
│      ├─ yuka.jpg
│      └─ wall.jpg
├─ src/
│  ├─ components/
│  │   └─ PlayerControls.jsx
│  ├─ App.jsx
│  └─ ...
└─ README.md
```

## 備考

- テクスチャ画像は `public/textures/` 配下に配置してください。
- コードのカスタマイズや拡張も自由にどうぞ。
