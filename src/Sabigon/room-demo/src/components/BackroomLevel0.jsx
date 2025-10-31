// src/components/BackroomLevel0.jsx
// Backroom Level 0 の3D環境

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { generateBackroomLevel0, getEnemySpawnPositions } from "../backroomGenerator";
import NoclipManager from "./NoclipEvent";
import VHSEffect from "./VHSEffect";
import Entity from "./Entity";
import GameOverScreen from "./GameOverScreen";

function getWallPositionsFromMaze(maze, wallSize = 2) {
  const positions = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 1) {
        positions.push([x * wallSize, 1.5, y * wallSize]);
      }
    }
  }
  return positions;
}

export default function BackroomLevel0({ onEscape }) {
  const audioRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerPosition, setPlayerPosition] = useState(null);
  const entityPositionsRef = useRef([]); // stateからrefに変更
  const [vhsNoiseIntensity, setVhsNoiseIntensity] = useState(0.5);
  const lastPlayerUpdateTime = useRef(0); // プレイヤー位置更新のthrottle用
  const lastVhsIntensityUpdate = useRef(0); // VHS強度更新のthrottle用
  
  const mazeWidth = 31; // パフォーマンス最適化のため31x31に設定
  const mazeHeight = 31;
  const wallSize = 2;
  
  // maze、wallPositions、enemyPositions、escapeDoorPosを一度だけ生成
  const [maze] = useState(() => generateBackroomLevel0(mazeWidth, mazeHeight));
  const [wallPositions] = useState(() => getWallPositionsFromMaze(maze, wallSize));
  const [enemyPositions] = useState(() => {
    const positions = getEnemySpawnPositions(maze, 3);
    console.log('[BackroomLevel0] Enemy positions:', positions);
    return positions;
  });
  
  // ジャンプスケアのトリガー（今後の実装用）
  // const [jumpScareTriggers] = useState(() => getJumpScareTriggers(maze, 5));

  // プレイヤーの初期位置（安全な場所を選択）
  const [playerStartPos] = useState(() => {
    const safeFreeSpaces = [];
    for (let y = 2; y < mazeHeight - 2; y++) {
      for (let x = 2; x < mazeWidth - 2; x++) {
        // 3x3の範囲が空いている場所を探す
        if (maze[y][x] === 0 &&
            maze[y - 1][x] === 0 && maze[y + 1][x] === 0 &&
            maze[y][x - 1] === 0 && maze[y][x + 1] === 0 &&
            maze[y - 1][x - 1] === 0 && maze[y - 1][x + 1] === 0 &&
            maze[y + 1][x - 1] === 0 && maze[y + 1][x + 1] === 0) {
          safeFreeSpaces.push([x, y]);
        }
      }
    }
    
    // 安全な場所がない場合は通常の空きスペースから選択
    if (safeFreeSpaces.length === 0) {
      for (let y = 1; y < mazeHeight - 1; y++) {
        for (let x = 1; x < mazeWidth - 1; x++) {
          if (maze[y][x] === 0) {
            safeFreeSpaces.push([x, y]);
          }
        }
      }
    }
    
    const startPos = safeFreeSpaces[Math.floor(Math.random() * safeFreeSpaces.length)];
    console.log('[BackroomLevel0] Player start position:', startPos);
    return startPos;
  });

  // 脱出ドアの位置（プレイヤー開始位置から最も遠い場所に配置）
  const [escapeDoorPos] = useState(() => {
    const freeSpaces = [];
    for (let y = 1; y < mazeHeight - 1; y++) {
      for (let x = 1; x < mazeWidth - 1; x++) {
        // 現在のセルと周囲のセルが空いているかチェック
        if (maze[y][x] === 0) {
          // 周囲のセルも空いているか確認（最低2x2の空間）
          const hasSpace = 
            maze[y][x + 1] === 0 || 
            maze[y][x - 1] === 0 || 
            maze[y + 1][x] === 0 || 
            maze[y - 1][x] === 0;
          
          if (hasSpace) {
            freeSpaces.push([x, y]);
          }
        }
      }
    }
    
    // プレイヤー開始位置から最も遠い場所を探す
    let farthestPos = freeSpaces[0];
    let maxDistance = 0;
    
    for (const pos of freeSpaces) {
      const distance = Math.sqrt(
        Math.pow(pos[0] - playerStartPos[0], 2) + 
        Math.pow(pos[1] - playerStartPos[1], 2)
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        farthestPos = pos;
      }
    }
    
    return farthestPos;
  });

  // BGM管理
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.4;
      audio.play().catch(err => console.log('Audio play failed:', err));
    }

    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  const handleEntityCatch = () => {
    setGameOver(true);
  };

  const handleRestart = () => {
    window.location.reload();
  };

  // プレイヤー位置の更新（throttle付き - 100msごとに更新）
  const handlePlayerPositionUpdate = (position) => {
    const now = Date.now();
    if (now - lastPlayerUpdateTime.current > 100) {
      setPlayerPosition(position);
      lastPlayerUpdateTime.current = now;
    }
  };

  // エンティティの位置更新を受け取る（refを使用してre-renderを防ぐ）
  const handleEntityPositionUpdate = (index, position) => {
    entityPositionsRef.current[index] = position;
    
    // VHSノイズ強度を再計算（300msごとにthrottle）
    const now = Date.now();
    if (now - lastVhsIntensityUpdate.current < 300) return;
    if (!playerPosition) return;
    
    let minDistance = Infinity;
    for (const entityPos of entityPositionsRef.current) {
      if (!entityPos) continue;
      const distance = Math.sqrt(
        Math.pow(playerPosition.x - entityPos.x, 2) +
        Math.pow(playerPosition.z - entityPos.z, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    const maxEffectDistance = 10.0;
    let intensity = 0.3;
    if (minDistance < maxEffectDistance) {
      intensity = 1.0 - (minDistance / maxEffectDistance) * 0.7;
    }
    
    // 変化が大きい場合のみ更新（0.05以上の差）
    if (Math.abs(intensity - vhsNoiseIntensity) > 0.05) {
      setVhsNoiseIntensity(intensity);
      lastVhsIntensityUpdate.current = now;
    }
  };

  // ゲームオーバー画面を表示
  if (gameOver) {
    return <GameOverScreen onRestart={handleRestart} />;
  }

  return (
    <>
      <VHSEffect noiseIntensity={vhsNoiseIntensity}>
        <Canvas 
          camera={{ position: [playerStartPos[0] * wallSize, 1.6, playerStartPos[1] * wallSize], fov: 75 }}
          gl={{ 
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            antialias: false, // アンチエイリアスを無効化してパフォーマンス改善
            alpha: false
          }}
        >
          <ambientLight intensity={0.3} color="#ffffcc" />
          <directionalLight position={[10, 10, 5]} intensity={0.4} color="#ffffcc" />
          
          <BackroomEnvironment 
            maze={maze} 
            escapeDoorPos={escapeDoorPos}
          />
          
          {/* エンティティの配置 */}
          {enemyPositions.map((pos, index) => (
            <Entity
              key={index}
              position={[pos[0] * wallSize, 0.5, pos[1] * wallSize]}
              playerPosition={playerPosition}
              onCatch={handleEntityCatch}
              onPositionUpdate={(position) => handleEntityPositionUpdate(index, position)}
              maze={maze}
              wallSize={wallSize}
            />
          ))}
          
          <BackroomPlayerControls 
            wallPositions={wallPositions} 
            escapeDoorPos={escapeDoorPos}
            onEscape={onEscape}
            onPositionUpdate={handlePlayerPositionUpdate}
            mazeWidth={mazeWidth}
            mazeHeight={mazeHeight}
            wallSize={wallSize}
          />
        </Canvas>
      </VHSEffect>
      
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#ffff00",
          zIndex: 10001,
          userSelect: "none",
          textShadow: "0 0 5px #000",
          fontFamily: "monospace",
        }}
      >
        <p>🔴 LEVEL 0 - THE BACKROOMS</p>
        <p>WASDで移動、マウスで視点</p>
        <p>🚪 脱出ドアを見つけてください...</p>
        <p style={{ color: "#ff0000" }}>⚠️ 何かがあなたを見ている...</p>
      </div>
      
      {/* BGM */}
      <audio ref={audioRef} loop>
        <source src="/src/effect/sounds/Texture_Ambi01-1.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
}

const BackroomEnvironment = React.memo(function BackroomEnvironment({ maze, escapeDoorPos }) {
  const wallSize = 2;

  // Backroomのカーペットテクスチャを読み込み（床用）
  const carpetColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/carpet/carpet_color.png");
  const carpetNormalMap = useLoader(THREE.TextureLoader, "/textures/backrooms/carpet/carpet_normal.png");
  const carpetRoughnessMap = useLoader(THREE.TextureLoader, "/textures/backrooms/carpet/carpet_rough.png");

  // Backroomの壁紙テクスチャを読み込み（壁用）
  const wallpaperColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/wallpaper/wallpaper_color.png");
  const wallpaperNormalMap = useLoader(THREE.TextureLoader, "/textures/backrooms/wallpaper/wallpaper_normal.png");
  const wallpaperRoughnessMap = useLoader(THREE.TextureLoader, "/textures/backrooms/wallpaper/wallpaper_rough.png");

  // 天井タイルテクスチャを読み込み（天井用）
  const ceilingColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/ceiling_tiles/ceiling_tiles_color.png");
  const ceilingNormalMap = useLoader(THREE.TextureLoader, "/textures/backrooms/ceiling_tiles/ceiling_tiles_normal.png");
  const ceilingRoughnessMap = useLoader(THREE.TextureLoader, "/textures/backrooms/ceiling_tiles/ceiling_tiles_rough.png");

  const repeatX = maze[0].length;
  const repeatY = maze.length;

  // テクスチャ設定を一度だけ実行
  useEffect(() => {
    // カーペットテクスチャの設定
    carpetColorMap.wrapS = carpetColorMap.wrapT = THREE.RepeatWrapping;
    carpetColorMap.repeat.set(repeatX * 0.5, repeatY * 0.5);
    carpetNormalMap.wrapS = carpetNormalMap.wrapT = THREE.RepeatWrapping;
    carpetNormalMap.repeat.set(repeatX * 0.5, repeatY * 0.5);
    carpetRoughnessMap.wrapS = carpetRoughnessMap.wrapT = THREE.RepeatWrapping;
    carpetRoughnessMap.repeat.set(repeatX * 0.5, repeatY * 0.5);

    // 壁紙テクスチャの設定
    wallpaperColorMap.wrapS = wallpaperColorMap.wrapT = THREE.RepeatWrapping;
    wallpaperColorMap.repeat.set(1, 1);
    wallpaperNormalMap.wrapS = wallpaperNormalMap.wrapT = THREE.RepeatWrapping;
    wallpaperNormalMap.repeat.set(1, 1);
    wallpaperRoughnessMap.wrapS = wallpaperRoughnessMap.wrapT = THREE.RepeatWrapping;
    wallpaperRoughnessMap.repeat.set(1, 1);

    // 天井タイルテクスチャの設定
    ceilingColorMap.wrapS = ceilingColorMap.wrapT = THREE.RepeatWrapping;
    ceilingColorMap.repeat.set(repeatX * 0.5, repeatY * 0.5);
    ceilingNormalMap.wrapS = ceilingNormalMap.wrapT = THREE.RepeatWrapping;
    ceilingNormalMap.repeat.set(repeatX * 0.5, repeatY * 0.5);
    ceilingRoughnessMap.wrapS = ceilingRoughnessMap.wrapT = THREE.RepeatWrapping;
    ceilingRoughnessMap.repeat.set(repeatX * 0.5, repeatY * 0.5);
  }, [carpetColorMap, carpetNormalMap, carpetRoughnessMap, wallpaperColorMap, wallpaperNormalMap, wallpaperRoughnessMap, ceilingColorMap, ceilingNormalMap, ceilingRoughnessMap, repeatX, repeatY]);

  // 脱出ドアの座標
  const doorPosition = [
    escapeDoorPos[0] * wallSize,
    1.0,
    escapeDoorPos[1] * wallSize,
  ];

  // 壁のメッシュをメモ化して再生成を防ぐ（依存配列からテクスチャを除外）
  const walls = useMemo(() => {
    return maze.map((row, y) =>
      row.map((cell, x) => {
        if (cell === 1) {
          return (
            <mesh
              key={`${x}-${y}`}
              position={[x * wallSize, 1.5, y * wallSize]}
            >
              <boxGeometry args={[wallSize, 3, wallSize]} />
              <meshStandardMaterial 
                map={wallpaperColorMap}
                normalMap={wallpaperNormalMap}
                roughnessMap={wallpaperRoughnessMap}
                roughness={0.7}
              />
            </mesh>
          );
        }
        return null;
      })
    );
  }, [maze, wallSize]); // テクスチャマップを依存配列から削除

  return (
    <>
      {/* 床 - Backroomsのカーペット */}
      <mesh rotation-x={-Math.PI / 2} position={[maze[0].length, 0, maze.length]}>
        <planeGeometry args={[maze[0].length * wallSize, maze.length * wallSize]} />
        <meshStandardMaterial 
          map={carpetColorMap}
          normalMap={carpetNormalMap}
          roughnessMap={carpetRoughnessMap}
          roughness={0.8}
        />
      </mesh>

      {/* 天井 - 蛍光灯のある天井タイル */}
      <mesh rotation-x={Math.PI / 2} position={[maze[0].length, 3, maze.length]}>
        <planeGeometry args={[maze[0].length * wallSize, maze.length * wallSize]} />
        <meshStandardMaterial 
          map={ceilingColorMap}
          normalMap={ceilingNormalMap}
          roughnessMap={ceilingRoughnessMap}
          emissive="#ffffaa"
          emissiveIntensity={0.2}
          roughness={0.6}
        />
      </mesh>

      {/* 壁 - Backroomsの壁紙 */}
      {walls}

      {/* 脱出ドア */}
      <group position={doorPosition}>
        {/* ドアフレーム */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[1.2, 2.4, 0.1]} />
          <meshStandardMaterial color="#8B4513" roughness={0.8} />
        </mesh>
        
        {/* ドアノブ */}
        <mesh position={[0.4, 0, 0.1]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* ドアの光 */}
        <pointLight position={[0, 0, 0.5]} intensity={2} color="#00ffff" distance={5} />
        
        {/* ドアサイン */}
        <mesh position={[0, 1.5, 0.15]}>
          <planeGeometry args={[0.8, 0.3]} />
          <meshStandardMaterial 
            color="#00ff00" 
            emissive="#00ff00" 
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* 今後の実装: ジャンプスケアトリガーの配置（デバッグ用、非表示にする） */}
      {/* {jumpScareTriggers.map((pos, i) => (
        <mesh key={`trigger-${i}`} position={[pos[0] * wallSize, 0.1, pos[1] * wallSize]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      ))} */}
    </>
  );
});

function BackroomPlayerControls({ wallPositions, escapeDoorPos, onEscape, onPositionUpdate, mazeWidth, mazeHeight, wallSize }) {
  const { camera, gl } = useThree();
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  const lastPosition = useRef(null);
  const initialized = useRef(false);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const isLocked = useRef(false);

  const walkSpeed = 3.0;
  const runSpeed = 6.0;

  const doorX = escapeDoorPos[0] * wallSize;
  const doorY = 1.0;
  const doorZ = escapeDoorPos[1] * wallSize;

  // マップ境界の計算
  const minX = 0;
  const maxX = mazeWidth * wallSize;
  const minZ = 0;
  const maxZ = mazeHeight * wallSize;

  useEffect(() => {
    const canvas = gl.domElement;

    // ポインターロック
    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };

    const onClick = (e) => {
      if (!isLocked.current) {
        canvas.requestPointerLock();
      }
    };

    const onMouseMove = (event) => {
      if (!isLocked.current) return;

      const movementX = event.movementX || 0;
      const movementY = event.movementY || 0;

      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y -= movementX * 0.002;
      euler.current.x -= movementY * 0.002;

      // 上下の角度を制限
      const maxPolarAngle = Math.PI * 0.95;
      const minPolarAngle = Math.PI * 0.05;
      euler.current.x = Math.max(minPolarAngle - Math.PI / 2, Math.min(maxPolarAngle - Math.PI / 2, euler.current.x));

      camera.quaternion.setFromEuler(euler.current);
    };

    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };

    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);
    document.addEventListener('click', onClick); // documentでクリックを検出
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      document.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((_, delta) => {
    // 初回のみカメラ位置を記録
    if (!initialized.current) {
      lastPosition.current = camera.position.clone();
      initialized.current = true;
      return; // 初回フレームはスキップ
    }

    // カメラのY位置を固定（ジャンプ防止）
    if (camera.position.y !== 1.6) {
      camera.position.y = 1.6;
    }

    direction.current.set(0, 0, 0);

    if (keys.current["KeyW"]) direction.current.z += 1;
    if (keys.current["KeyS"]) direction.current.z -= 1;
    if (keys.current["KeyA"]) direction.current.x -= 1;
    if (keys.current["KeyD"]) direction.current.x += 1;

    if (direction.current.length() > 0) direction.current.normalize();

    const front = new THREE.Vector3();
    camera.getWorldDirection(front);
    front.y = 0;
    front.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(front, camera.up).normalize();

    const move = new THREE.Vector3();
    const isRunning =
      keys.current["ShiftLeft"] || keys.current["Shift"] || keys.current["ShiftRight"];
    const speed = isRunning ? runSpeed : walkSpeed;

    move.addScaledVector(front, direction.current.z * speed * delta);
    move.addScaledVector(right, direction.current.x * speed * delta);

    const currentPos = camera.position.clone();

    // X方向だけ動かして判定
    const posX = currentPos.clone().add(new THREE.Vector3(move.x, 0, 0));
    const newX = posX.x;
    // マップ境界チェック（余白1メートル）
    if (newX > minX + 1 && newX < maxX - 1 && !isColliding(posX, wallPositions)) {
      camera.position.x += move.x;
    }

    // Z方向だけ動かして判定
    const posZ = currentPos.clone().add(new THREE.Vector3(0, 0, move.z));
    const newZ = posZ.z;
    // マップ境界チェック（余白1メートル）
    if (newZ > minZ + 1 && newZ < maxZ - 1 && !isColliding(posZ, wallPositions)) {
      camera.position.z += move.z;
    }

    // プレイヤー位置を親コンポーネントに通知（エンティティ追跡用）
    if (onPositionUpdate) {
      onPositionUpdate({
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      });
    }

    // 脱出ポイントとの当たり判定
    const dx = camera.position.x - doorX;
    const dy = camera.position.y - doorY;
    const dz = camera.position.z - doorZ;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 2.0) { // ドアの範囲
      onEscape();
    }

    // 今後の実装: ジャンプスケアトリガーの判定
    // checkJumpScareTriggers(camera.position, jumpScareTriggers, wallSize);

    lastPosition.current = camera.position.clone();
  });

  return null;
}

function isColliding(nextPos, wallPositions) {
  // 最適化: 近くの壁のみチェック（範囲を5メートル以内に制限）
  const checkRadius = 5;
  for (const [wx, _, wz] of wallPositions) {
    // 距離の粗いチェック（高速化）
    const roughDx = Math.abs(nextPos.x - wx);
    const roughDz = Math.abs(nextPos.z - wz);
    
    // 明らかに遠い壁はスキップ
    if (roughDx > checkRadius || roughDz > checkRadius) continue;
    
    const halfWidth = 1 + 0.5;
    const halfDepth = 1 + 0.5;

    if (roughDx <= halfWidth && roughDz <= halfDepth) {
      return true;
    }
  }
  return false;
}
