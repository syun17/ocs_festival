// src/components/OtherPlayer.jsx
// 他プレイヤーの3Dモデル表示コンポーネント

import React, { useRef, Suspense } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { Text } from "@react-three/drei";
import * as THREE from "three";

function PlayerModel({ position, rotation, texture }) {
  const groupRef = useRef();
  const gltf = useLoader(GLTFLoader, "/textures/backrooms/player/scene.gltf");

  // テクスチャを適用
  React.useEffect(() => {
    if (gltf && gltf.scene && texture) {
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.1
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    }
  }, [gltf, texture]);

  useFrame(() => {
    if (groupRef.current) {
      // スムーズな位置補間
      groupRef.current.position.lerp(
        new THREE.Vector3(position[0], position[1], position[2]),
        0.1
      );
      
      // スムーズな回転補間
      const targetRotation = rotation;
      const currentRotation = groupRef.current.rotation.y;
      let diff = targetRotation - currentRotation;
      
      // 最短経路で回転
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      
      groupRef.current.rotation.y += diff * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive 
        object={gltf.scene.clone()} 
        scale={0.8}
        rotation={[0, rotation, 0]}
      />
    </group>
  );
}

export default function OtherPlayer({ 
  position = [0, 0, 0], 
  rotation = 0,
  playerName = "Player"
}) {
  const texture = useLoader(
    THREE.TextureLoader, 
    "/textures/backrooms/player/textures/Material.001_baseColor.jpeg"
  );

  return (
    <group position={position}>
      {/* プレイヤーモデル */}
      <Suspense fallback={<SimpleFallback position={position} playerName={playerName} />}>
        <PlayerModel position={[0, 0, 0]} rotation={rotation} texture={texture} />
      </Suspense>
      
      {/* プレイヤー名表示 */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {playerName}
      </Text>
    </group>
  );
}

// フォールバック用のシンプルな表示
function SimpleFallback({ position, playerName }) {
  return (
    <group position={position}>
      {/* シンプルなキューブ */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.6, 1.8, 0.6]} />
        <meshStandardMaterial color="#00ff00" />
      </mesh>
      
      {/* 名前表示 */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="#00ff00"
        anchorX="center"
        anchorY="middle"
      >
        {playerName}
      </Text>
    </group>
  );
}
