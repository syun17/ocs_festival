// src/components/NoclipFalling3D.jsx
// 3D空間での落下演出

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function FallingCamera({ onComplete }) {
  const cameraRef = useRef();
  const startTime = useRef(Date.now());
  const initialY = useRef(1.6);

  useFrame(({ camera }) => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    
    if (elapsed < 2) {
      // 落下アニメーション (2秒間)
      const fallSpeed = elapsed * elapsed * 5; // 加速度的に落下
      camera.position.y = initialY.current - fallSpeed;
      
      // カメラを回転させる
      camera.rotation.z = elapsed * Math.PI;
      camera.rotation.x = -Math.PI / 4 + elapsed * 0.5;
    } else if (!cameraRef.current) {
      // 落下完了
      cameraRef.current = true;
      onComplete();
    }
  });

  return null;
}

function FallingEnvironment() {
  const particlesRef = useRef();

  useFrame(() => {
    if (particlesRef.current) {
      // パーティクルを上に移動させて落下感を演出
      particlesRef.current.rotation.y += 0.01;
      
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += 0.5;
        if (positions[i] > 50) {
          positions[i] = -50;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // パーティクルジオメトリを作成
  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }

  return (
    <>
      {/* 環境光 */}
      <ambientLight intensity={0.2} />
      
      {/* グリッチライト */}
      <pointLight position={[0, 0, 0]} intensity={2} color="#ff0000" distance={50} />
      <pointLight position={[10, -10, 10]} intensity={1} color="#ffff00" distance={30} />
      
      {/* 落下中のパーティクル */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.5} color="#ffffff" transparent opacity={0.6} />
      </points>

      {/* 遠くの壁のようなもの */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const radius = 20;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * radius,
              -20,
              Math.sin(angle) * radius
            ]}
            rotation={[0, -angle, 0]}
          >
            <planeGeometry args={[10, 100]} />
            <meshStandardMaterial 
              color="#222222" 
              emissive="#ffff00"
              emissiveIntensity={0.1}
              transparent
              opacity={0.3}
            />
          </mesh>
        );
      })}

      {/* グリッチボックス */}
      {[...Array(20)].map((_, i) => (
        <mesh
          key={`box-${i}`}
          position={[
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40 - 10,
            (Math.random() - 0.5) * 40
          ]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ]}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            color={Math.random() > 0.5 ? "#ff0000" : "#ffff00"}
            emissive={Math.random() > 0.5 ? "#ff0000" : "#ffff00"}
            emissiveIntensity={0.5}
            wireframe
          />
        </mesh>
      ))}
    </>
  );
}

export default function NoclipFalling3D({ onComplete }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // BGMを再生
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.6;
      audio.play().catch(err => console.log('Audio play failed:', err));
    }

    return () => {
      // クリーンアップ時に音声を停止
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100vw", 
      height: "100vh",
      backgroundColor: "#000"
    }}>
      <Canvas 
        camera={{ position: [0, 1.6, 0], fov: 75 }}
        gl={{ 
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
          antialias: false,
          alpha: false
        }}
      >
        <FallingCamera onComplete={onComplete} />
        <FallingEnvironment />
      </Canvas>

      {/* オーバーレイテキスト */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "48px",
          color: "#ff0000",
          fontFamily: "monospace",
          textShadow: "0 0 10px #ff0000",
          animation: "glitchText 0.1s infinite",
          pointerEvents: "none",
          zIndex: 1000,
        }}
      >
        NO CLIP
      </div>

      <style>
        {`
          @keyframes glitchText {
            0%, 100% {
              transform: translate(-50%, -50%);
              opacity: 1;
            }
            25% {
              transform: translate(calc(-50% - 5px), calc(-50% + 5px));
              opacity: 0.8;
            }
            50% {
              transform: translate(calc(-50% + 5px), calc(-50% - 5px));
              opacity: 0.9;
            }
            75% {
              transform: translate(calc(-50% - 3px), calc(-50% - 3px));
              opacity: 0.7;
            }
          }
        `}
      </style>
      
      {/* BGM */}
      <audio ref={audioRef} loop>
        <source src="/src/effect/sounds/Texture_Ambi02-2.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
