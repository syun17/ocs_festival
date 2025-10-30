// src/components/BackroomLevel0.jsx
// Backroom Level 0 の3D環境

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import * as THREE from "three";
import { generateBackroomLevel0, getEnemySpawnPositions } from "../backroomGenerator";
import NoclipManager from "./NoclipEvent";

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
  const mazeWidth = 31;
  const mazeHeight = 31;
  const maze = generateBackroomLevel0(mazeWidth, mazeHeight);

  const wallSize = 2;
  const wallPositions = getWallPositionsFromMaze(maze, wallSize);

  // 敵の配置位置（今後の実装用）
  const [enemyPositions] = useState(() => getEnemySpawnPositions(maze, 3));
  
  // ジャンプスケアのトリガー（今後の実装用）
  // const [jumpScareTriggers] = useState(() => getJumpScareTriggers(maze, 5));

  // 脱出ポイント（ランダムに配置）
  const [escapePos] = useState(() => {
    const freeSpaces = [];
    for (let y = 0; y < mazeHeight; y++) {
      for (let x = 0; x < mazeWidth; x++) {
        if (maze[y][x] === 0) {
          freeSpaces.push([x, y]);
        }
      }
    }
    return freeSpaces[Math.floor(Math.random() * freeSpaces.length)];
  });

  return (
    <>
      <Canvas camera={{ position: [2, 1.6, 2], fov: 75 }}>
        <ambientLight intensity={0.3} color="#ffffcc" />
        <directionalLight position={[10, 10, 5]} intensity={0.4} color="#ffffcc" />
        
        <BackroomEnvironment 
          maze={maze} 
          escapePos={escapePos}
          enemyPositions={enemyPositions}
        />
        
        <BackroomPlayerControls 
          wallPositions={wallPositions} 
          escapePos={escapePos}
          onEscape={onEscape}
        />
      </Canvas>
      
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#ffff00",
          zIndex: 1,
          userSelect: "none",
          textShadow: "0 0 5px #000",
          fontFamily: "monospace",
        }}
      >
        <p>🔴 LEVEL 0 - THE BACKROOMS</p>
        <p>WASDで移動、マウスで視点</p>
        <p>脱出ポイントを見つけてください...</p>
        <p style={{ color: "#ff0000" }}>⚠️ 何かがあなたを見ている...</p>
      </div>
    </>
  );
}

function BackroomEnvironment({ maze, escapePos, enemyPositions }) {
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

  const escapePosition = [
    escapePos[0] * wallSize,
    0.75,
    escapePos[1] * wallSize,
  ];

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
      {maze.map((row, y) =>
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
      )}

      {/* 脱出ポイント - 青白く光る球体 */}
      <mesh position={escapePosition}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial 
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 今後の実装: 敵の配置 */}
      {enemyPositions.map((pos, i) => (
        <EnemyPlaceholder key={i} position={[pos[0] * wallSize, 1, pos[1] * wallSize]} />
      ))}

      {/* 今後の実装: ジャンプスケアトリガーの配置（デバッグ用、非表示にする） */}
      {/* {jumpScareTriggers.map((pos, i) => (
        <mesh key={`trigger-${i}`} position={[pos[0] * wallSize, 0.1, pos[1] * wallSize]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#ff0000" transparent opacity={0.3} />
        </mesh>
      ))} */}
    </>
  );
}

// 敵のプレースホルダー（今後の実装用）
function EnemyPlaceholder({ position }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // 簡単なアニメーション
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[0.5, 1.5, 0.5]} />
      <meshStandardMaterial color="#330000" />
    </mesh>
  );
}

function BackroomPlayerControls({ wallPositions, escapePos, onEscape }) {
  const { camera } = useThree();
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  const lastPosition = useRef(camera.position.clone());

  const wallSize = 2;
  const walkSpeed = 3.0; // バックルームでは少し遅く
  const runSpeed = 6.0;

  const escapePosition = [
    escapePos[0] * wallSize,
    0.75,
    escapePos[1] * wallSize,
  ];

  useEffect(() => {
    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };
    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
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
    if (!isColliding(posX, wallPositions)) {
      camera.position.x += move.x;
    }

    // Z方向だけ動かして判定
    const posZ = currentPos.clone().add(new THREE.Vector3(0, 0, move.z));
    if (!isColliding(posZ, wallPositions)) {
      camera.position.z += move.z;
    }

    // 脱出ポイントとの当たり判定
    const dx = camera.position.x - escapePosition[0];
    const dy = camera.position.y - escapePosition[1];
    const dz = camera.position.z - escapePosition[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < 1.5) {
      onEscape();
    }

    // 今後の実装: ジャンプスケアトリガーの判定
    // checkJumpScareTriggers(camera.position, jumpScareTriggers, wallSize);

    lastPosition.current = camera.position.clone();
  });

  return <PointerLockControls />;
}

function isColliding(nextPos, wallPositions) {
  for (const [wx, _, wz] of wallPositions) {
    const dx = nextPos.x - wx;
    const dz = nextPos.z - wz;
    const distanceX = Math.abs(dx);
    const distanceZ = Math.abs(dz);
    const halfWidth = 1 + 0.5;
    const halfDepth = 1 + 0.5;

    if (distanceX <= halfWidth && distanceZ <= halfDepth) {
      return true;
    }
  }
  return false;
}
