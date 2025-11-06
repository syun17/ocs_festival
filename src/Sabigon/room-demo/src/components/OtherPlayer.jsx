// src/components/OtherPlayer.jsx
// 他プレイヤーの3Dモデル表示コンポーネント

import React, { useRef, useEffect } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";

export default function OtherPlayer({ 
  position = [0, 0, 0], 
  rotation = 0,
  playerName = "Player"
}) {
  const groupRef = useRef();
  const gltf = useLoader(GLTFLoader, "/textures/backrooms/player/scene.gltf");
  const texture = useLoader(THREE.TextureLoader, "/textures/backrooms/player/textures/Material.001_baseColor.jpeg");

  useEffect(() => {
    if (gltf && gltf.scene) {
      // テクスチャを適用
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
      {/* プレイヤーモデル */}
      <primitive 
        object={gltf.scene.clone()} 
        scale={0.8}
        rotation={[0, rotation, 0]}
      />
      
      {/* プレイヤー名表示 */}
      <mesh position={[0, 2.5, 0]}>
        <planeGeometry args={[2, 0.5]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* プレイヤー名テキスト（シンプルなラベル） */}
      <mesh position={[0, 2.5, 0.01]}>
        <textGeometry args={[playerName, { size: 0.2, height: 0.01 }]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}
