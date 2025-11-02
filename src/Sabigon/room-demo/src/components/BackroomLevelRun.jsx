// src/components/BackroomLevelRun.jsx
// Backroom Level ! (Run For Your Life!) の3D環境

import React, { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import Entity from "./Entity";
import GameOverScreen from "./GameOverScreen";
import VHSEffect from "./VHSEffect";

// 病院の廊下を生成（一本道 + 障害物）
function generateHospitalCorridor(length = 100) {
  const width = 7; // 廊下の幅
  const maze = [];
  
  for (let z = 0; z < length; z++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // 両端は壁
      if (x === 0 || x === width - 1) {
        row.push(1);
      } else {
        row.push(0);
      }
    }
    maze.push(row);
  }
  
  return maze;
}

// 障害物の位置を生成（ベッド、医療機器、棚など）
function generateObstacles(maze, count = 30) {
  const obstacles = [];
  const width = maze[0].length;
  const length = maze.length;
  
  for (let i = 0; i < count; i++) {
    // 開始地点から20マス以降にランダム配置
    const z = 20 + Math.floor(Math.random() * (length - 30));
    // 廊下の中央付近に配置（壁を避ける）
    const x = 2 + Math.floor(Math.random() * (width - 4));
    
    // 障害物のタイプ
    const type = Math.floor(Math.random() * 4);
    obstacles.push({
      position: [x * 2, 0.5, z * 2],
      type: type, // 0: ベッド, 1: 医療カート, 2: 棚, 3: 車椅子
      rotation: Math.random() * Math.PI * 2,
      gridX: x,
      gridZ: z
    });
  }
  
  return obstacles;
}

// エンティティの初期位置を生成（後方から追跡）
function generateChasingEntities(playerStartZ, count = 8) {
  const entities = [];
  const startZ = playerStartZ - 10; // プレイヤーの10マス後方から開始
  
  for (let i = 0; i < count; i++) {
    const x = 2 + (i % 5) * 2; // 横に並べて配置
    const z = startZ - Math.floor(i / 5) * 3;
    entities.push([x, z]);
  }
  
  return entities;
}

export default function BackroomLevelRun({ onEscape, onGameOver }) {
  const audioRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [distance, setDistance] = useState(0); // ゴールまでの距離
  const wallSize = 2;
  const corridorLength = 100;
  const goalDistance = corridorLength * wallSize - 20; // ゴール地点
  
  const [maze] = useState(() => generateHospitalCorridor(corridorLength));
  const [obstacles] = useState(() => generateObstacles(maze, 30));
  const [playerStartPos] = useState([6, 5]); // 開始位置
  const [enemyPositions] = useState(() => generateChasingEntities(playerStartPos[1], 8));
  
  // プレイヤーの位置更新
  const handlePlayerPositionUpdate = (position) => {
    setPlayerPosition(position);
    
    // ゴールまでの距離を計算
    const distanceToGoal = goalDistance - position.z;
    setDistance(Math.max(0, Math.floor(distanceToGoal)));
    
    // ゴール到達チェック
    if (position.z >= goalDistance) {
      console.log('[BackroomLevelRun] Player reached the goal!');
      if (onEscape) {
        onEscape();
      }
    }
  };

  // エンティティに捕まった時の処理
  const handleEntityCatch = () => {
    setGameOver(true);
    if (onGameOver) {
      onGameOver();
    }
  };

  // BGM再生
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch((err) => {
        console.log("Audio play failed:", err.message);
      });
    }
  }, []);

  if (gameOver) {
    return <GameOverScreen onRestart={() => window.location.reload()} />;
  }

  return (
    <>
      <VHSEffect intensity={0.8}>
        <Canvas
          camera={{ position: [6, 2, 10], fov: 75 }}
          gl={{
            preserveDrawingBuffer: false,
            powerPreference: "high-performance",
            antialias: false,
            alpha: false
          }}
          style={{ pointerEvents: 'auto' }}
        >
          {/* 赤い緊急灯の雰囲気 */}
          <ambientLight intensity={0.2} color="#ff4444" />
          <directionalLight position={[0, 10, 5]} intensity={0.3} color="#ff0000" />
          
          <HospitalEnvironment 
            maze={maze}
            obstacles={obstacles}
            goalZ={goalDistance}
          />
          
          {/* 追跡エンティティの配置 */}
          {enemyPositions.map((pos, index) => (
            <Entity
              key={index}
              position={[pos[0] * wallSize, 0.5, pos[1] * wallSize]}
              playerPosition={playerPosition}
              onCatch={handleEntityCatch}
              maze={maze}
              wallSize={wallSize}
            />
          ))}
          
          <HospitalPlayerControls 
            maze={maze}
            obstacles={obstacles}
            onPositionUpdate={handlePlayerPositionUpdate}
            startPosition={playerStartPos}
            wallSize={wallSize}
          />
        </Canvas>
      </VHSEffect>
      
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#ff0000",
          zIndex: 10001,
          userSelect: "none",
          textShadow: "0 0 10px #ff0000",
          fontFamily: "monospace",
          fontSize: "18px",
          fontWeight: "bold"
        }}
      >
        <p style={{ fontSize: "24px", margin: "5px 0" }}>🚨 LEVEL ! - RUN FOR YOUR LIFE! 🚨</p>
        <p>前方へ逃げろ! WASD移動、マウス視点</p>
        <p style={{ fontSize: "20px", color: "#ffff00" }}>
          ゴールまで: {distance}m
        </p>
        <p style={{ color: "#ffffff", fontSize: "16px" }}>⚠️ 後ろを振り返るな!</p>
      </div>
      
      {/* 緊急BGM */}
      <audio ref={audioRef} loop>
        <source src="/src/effect/sounds/Texture_Ambi01-1.mp3" type="audio/mpeg" />
      </audio>
    </>
  );
}

// 病院環境のコンポーネント
const HospitalEnvironment = React.memo(function HospitalEnvironment({ maze, obstacles, goalZ }) {
  const wallSize = 2;

  // 病院のタイルテクスチャを読み込み
  const floorColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/pool_tiles/pool_tiles_color.png");
  const floorNormalMap = useLoader(THREE.TextureLoader, "/textures/backrooms/pool_tiles/pool_tiles_normal.png");
  const floorRoughnessMap = useLoader(THREE.TextureLoader, "/textures/backrooms/pool_tiles/pool_tiles_rough.png");

  const wallColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/painted_wall/painted_wall_color.png");
  const wallNormalMap = useLoader(THREE.TextureLoader, "/textures/backrooms/painted_wall/painted_wall_normal.png");

  const ceilingColorMap = useLoader(THREE.TextureLoader, "/textures/backrooms/ceiling_tiles_2/ceiling_tiles_2_color.png");

  const repeatX = maze[0].length;
  const repeatZ = maze.length;

  useEffect(() => {
    floorColorMap.wrapS = floorColorMap.wrapT = THREE.RepeatWrapping;
    floorColorMap.repeat.set(repeatX * 0.5, repeatZ * 0.5);
    floorNormalMap.wrapS = floorNormalMap.wrapT = THREE.RepeatWrapping;
    floorNormalMap.repeat.set(repeatX * 0.5, repeatZ * 0.5);
    floorRoughnessMap.wrapS = floorRoughnessMap.wrapT = THREE.RepeatWrapping;
    floorRoughnessMap.repeat.set(repeatX * 0.5, repeatZ * 0.5);

    wallColorMap.wrapS = wallColorMap.wrapT = THREE.RepeatWrapping;
    wallColorMap.repeat.set(1, 1);
    wallNormalMap.wrapS = wallNormalMap.wrapT = THREE.RepeatWrapping;
    wallNormalMap.repeat.set(1, 1);

    ceilingColorMap.wrapS = ceilingColorMap.wrapT = THREE.RepeatWrapping;
    ceilingColorMap.repeat.set(repeatX * 0.5, repeatZ * 0.5);
  }, [floorColorMap, floorNormalMap, floorRoughnessMap, wallColorMap, wallNormalMap, ceilingColorMap, repeatX, repeatZ]);

  const walls = useMemo(() => {
    const wallMeshes = [];
    
    for (let z = 0; z < maze.length; z++) {
      for (let x = 0; x < maze[z].length; x++) {
        if (maze[z][x] === 1) {
          wallMeshes.push(
            <mesh
              key={`wall-${x}-${z}`}
              position={[x * wallSize, 1.5, z * wallSize]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[wallSize, 3, wallSize]} />
              <meshStandardMaterial 
                map={wallColorMap}
                normalMap={wallNormalMap}
                color="#cccccc"
              />
            </mesh>
          );
        }
      }
    }
    
    return wallMeshes;
  }, [maze, wallSize, wallColorMap, wallNormalMap]);

  return (
    <>
      {/* 床 */}
      <mesh rotation-x={-Math.PI / 2} position={[maze[0].length, 0, maze.length]}>
        <planeGeometry args={[maze[0].length * wallSize, maze.length * wallSize]} />
        <meshStandardMaterial 
          map={floorColorMap}
          normalMap={floorNormalMap}
          roughnessMap={floorRoughnessMap}
          color="#ffffff"
        />
      </mesh>

      {/* 天井 */}
      <mesh rotation-x={Math.PI / 2} position={[maze[0].length, 3, maze.length]}>
        <planeGeometry args={[maze[0].length * wallSize, maze.length * wallSize]} />
        <meshStandardMaterial 
          map={ceilingColorMap}
          color="#dddddd"
        />
      </mesh>

      {/* 壁 */}
      {walls}

      {/* 障害物 */}
      {obstacles.map((obstacle, i) => (
        <Obstacle key={i} {...obstacle} />
      ))}

      {/* ゴールエリア */}
      <mesh position={[maze[0].length, 1, goalZ]}>
        <boxGeometry args={[maze[0].length * wallSize, 3, 2]} />
        <meshStandardMaterial 
          color="#00ff00"
          emissive="#00ff00"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 緊急灯（点滅） */}
      <EmergencyLights corridorLength={maze.length} width={maze[0].length} />
    </>
  );
});

// 障害物コンポーネント
function Obstacle({ position, type, rotation }) {
  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y = rotation;
    }
  }, [rotation]);

  // 障害物のタイプ別の形状と色
  const getObstacleGeometry = () => {
    switch (type) {
      case 0: // ベッド
        return (
          <group ref={meshRef} position={position}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[1.2, 0.6, 2.0]} />
              <meshStandardMaterial color="#888888" />
            </mesh>
            <mesh position={[0, 0.5, -0.8]} castShadow>
              <boxGeometry args={[1.2, 0.4, 0.4]} />
              <meshStandardMaterial color="#666666" />
            </mesh>
          </group>
        );
      case 1: // 医療カート
        return (
          <group ref={meshRef} position={position}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[1.0, 1.0, 0.7]} />
              <meshStandardMaterial color="#aaaaaa" metalness={0.5} />
            </mesh>
          </group>
        );
      case 2: // 棚
        return (
          <group ref={meshRef} position={position}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.5, 2.0, 1.2]} />
              <meshStandardMaterial color="#8b4513" />
            </mesh>
          </group>
        );
      case 3: // 車椅子
        return (
          <group ref={meshRef} position={position}>
            <mesh position={[0, 0, 0]} castShadow>
              <boxGeometry args={[0.8, 0.8, 0.8]} />
              <meshStandardMaterial color="#444444" />
            </mesh>
          </group>
        );
      default:
        return null;
    }
  };

  return getObstacleGeometry();
}

// 緊急灯（点滅）
function EmergencyLights({ corridorLength, width }) {
  const [intensity, setIntensity] = useState(1.0);

  useFrame((state) => {
    // 点滅効果
    const newIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    setIntensity(newIntensity);
  });

  const lights = useMemo(() => {
    const result = [];
    for (let z = 0; z < corridorLength; z += 10) {
      result.push(
        <pointLight
          key={`light-${z}`}
          position={[width, 2.5, z * 2]}
          color="#ff0000"
          intensity={intensity * 2}
          distance={15}
          decay={2}
        />
      );
    }
    return result;
  }, [corridorLength, width, intensity]);

  return <>{lights}</>;
}

// プレイヤーコントロール
function HospitalPlayerControls({ maze, obstacles, onPositionUpdate, startPosition, wallSize }) {
  const { camera } = useThree();
  const moveSpeed = useRef(6.0);
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  const lastUpdateTime = useRef(0);
  const isLocked = useRef(false);

  useEffect(() => {
    camera.position.set(startPosition[0] * wallSize, 1.6, startPosition[1] * wallSize);
    camera.rotation.set(0, 0, 0);

    const handleKeyDown = (e) => {
      keys.current[e.code] = true;
    };

    const handleKeyUp = (e) => {
      keys.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // ポインターロック
    const canvas = document.querySelector("canvas");
    
    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === canvas;
    };

    const onClick = () => {
      if (!isLocked.current) {
        canvas.requestPointerLock();
      }
    };

    const handleMouseMove = (e) => {
      if (!isLocked.current) return;
      
      camera.rotation.y -= e.movementX * 0.002;
      camera.rotation.x += e.movementY * 0.002; // 上下を反転
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    };

    document.addEventListener("pointerlockchange", onPointerLockChange);
    document.addEventListener("click", onClick);
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("click", onClick);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [camera, startPosition, wallSize]);

  useFrame((state, delta) => {
    direction.current.set(0, 0, 0);

    if (keys.current["KeyS"]) direction.current.z = -1;
    if (keys.current["KeyW"]) direction.current.z = 1;
    if (keys.current["KeyA"]) direction.current.x = -1;
    if (keys.current["KeyD"]) direction.current.x = 1;

    if (direction.current.length() > 0) {
      direction.current.normalize();
      
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      right.y = 0;
      right.normalize();

      velocity.current.set(0, 0, 0);
      velocity.current.addScaledVector(forward, direction.current.z);
      velocity.current.addScaledVector(right, direction.current.x);
      velocity.current.normalize();
      velocity.current.multiplyScalar(moveSpeed.current * delta);

      const nextPos = camera.position.clone().add(velocity.current);
      
      // 壁と障害物の判定
      const gridX = Math.floor(nextPos.x / wallSize);
      const gridZ = Math.floor(nextPos.z / wallSize);
      
      let canMove = true;
      
      // 壁判定
      if (gridX < 0 || gridX >= maze[0].length || 
          gridZ < 0 || gridZ >= maze.length || 
          maze[gridZ][gridX] === 1) {
        canMove = false;
      }
      
      // 障害物判定
      if (canMove) {
        for (const obstacle of obstacles) {
          const dx = nextPos.x - obstacle.position[0];
          const dz = nextPos.z - obstacle.position[2];
          const distance = Math.sqrt(dx * dx + dz * dz);
          
          // 障害物との距離が1メートル以下なら衝突
          if (distance < 1.0) {
            canMove = false;
            break;
          }
        }
      }
      
      if (canMove) {
        camera.position.copy(nextPos);
      }
    }

    // 位置を親コンポーネントに報告
    const now = Date.now();
    if (now - lastUpdateTime.current > 100) {
      onPositionUpdate(camera.position);
      lastUpdateTime.current = now;
    }
  });

  return null;
}
