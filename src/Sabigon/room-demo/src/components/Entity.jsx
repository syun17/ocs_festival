// src/components/Entity.jsx
// Backroomの敵エンティティ

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export default function Entity({ position, playerPosition, onCatch, onPositionUpdate, maze, wallSize = 2 }) {
  const groupRef = useRef();
  const modelRef = useRef();
  const stateRef = useRef('wandering'); // 'wandering' or 'chasing'
  const wanderTargetRef = useRef(null);
  const wanderTimeRef = useRef(0);
  const lastPositionUpdateTime = useRef(0); // 位置更新のthrottle用
  const modelMaterialsRef = useRef([]); // モデルのマテリアルを保持

  // GLTFモデルを読み込む
  useEffect(() => {
    const loader = new GLTFLoader();
    
    loader.loadAsync('/textures/backrooms/Entities/scene.gltf')
      .then((gltf) => {
        console.log('[Entity] GLTF loaded successfully', gltf);
        
        if (modelRef.current && gltf.scene) {
          // 既存の子要素をクリア
          while (modelRef.current.children.length > 0) {
            modelRef.current.remove(modelRef.current.children[0]);
          }
          
          // モデルをグループに追加
          const model = gltf.scene;
          model.scale.set(2.0, 2.0, 2.0); // スケールをさらに大きく調整
          model.position.set(0, 0, 0);
          
          // モデル全体を赤く発光させる
          model.traverse((child) => {
            if (child.isMesh) {
              const material = new THREE.MeshStandardMaterial({
                color: '#ff4444',
                emissive: '#ff0000',
                emissiveIntensity: 0.5,
                roughness: 0.3,
                metalness: 0.1
              });
              child.material = material;
              child.castShadow = true;
              // マテリアルをリストに保存
              modelMaterialsRef.current.push(material);
            }
          });
          
          modelRef.current.add(model);
          
          // アニメーションがあれば再生
          if (gltf.animations && gltf.animations.length > 0) {
            console.log('[Entity] Animations found:', gltf.animations.length);
            const mixer = new THREE.AnimationMixer(model);
            gltf.animations.forEach((clip) => {
              const action = mixer.clipAction(clip);
              action.play();
            });
            modelRef.current.userData.mixer = mixer;
          }
          
          console.log('[Entity] Model loaded and displayed');
        }
      })
      .catch((error) => {
        console.error('[Entity] Error loading GLTF:', error);
      });
  }, []);

  // 初期位置を設定（一度だけ）
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(position[0], 0.5, position[2]);
      console.log('[Entity] Initialized at position:', groupRef.current.position);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // positionを依存配列から削除して一度だけ実行

  // 壁との衝突判定
  const checkWallCollision = (nextPos) => {
    if (!maze) return false;
    
    const gridX = Math.floor(nextPos.x / wallSize);
    const gridZ = Math.floor(nextPos.z / wallSize);
    
    // マップ境界チェック
    if (gridX < 0 || gridX >= maze[0].length || gridZ < 0 || gridZ >= maze.length) {
      return true;
    }
    
    // 壁かどうかチェック
    if (maze[gridZ][gridX] === 1) {
      return true;
    }
    
    // 周囲のセルもチェック（より正確な衝突判定）- 半径を小さくして動きやすく
    const checkRadius = 0.3;
    const offsets = [
      [checkRadius, 0],
      [-checkRadius, 0],
      [0, checkRadius],
      [0, -checkRadius]
    ];
    
    for (const [dx, dz] of offsets) {
      const checkX = Math.floor((nextPos.x + dx) / wallSize);
      const checkZ = Math.floor((nextPos.z + dz) / wallSize);
      
      if (checkX < 0 || checkX >= maze[0].length || checkZ < 0 || checkZ >= maze.length) {
        return true;
      }
      
      if (maze[checkZ][checkX] === 1) {
        return true;
      }
    }
    
    return false;
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const entityPos = groupRef.current.position;
    
    // Y座標を常に0.5に固定(モデルが地面に埋まらないように)
    entityPos.y = 0.5;
    
    // アニメーションミキサーの更新
    if (modelRef.current?.userData?.mixer) {
      modelRef.current.userData.mixer.update(delta);
    }
    
    // モデルのマテリアルを状態に応じて更新
    if (modelMaterialsRef.current.length > 0) {
      const isChasing = stateRef.current === 'chasing';
      modelMaterialsRef.current.forEach(material => {
        material.emissiveIntensity = isChasing ? 1.5 : 0.5;
        material.color.setHex(isChasing ? 0xff0000 : 0xff4444);
      });
    }
    
    // プレイヤー位置がまだ取得できていない場合は徘徊モードのみ
    if (!playerPosition) {
      stateRef.current = 'wandering';
      
      wanderTimeRef.current += delta;

      // 3秒ごとに新しいランダムな目標地点を設定
      if (!wanderTargetRef.current || wanderTimeRef.current > 3.0) {
        // ランダムな方向に移動
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 5;
        wanderTargetRef.current = new THREE.Vector3(
          entityPos.x + Math.cos(angle) * distance,
          0.5,
          entityPos.z + Math.sin(angle) * distance
        );
        wanderTimeRef.current = 0;
      }

      // 目標地点に向かって移動
      if (wanderTargetRef.current) {
        const wanderDirection = new THREE.Vector3(
          wanderTargetRef.current.x - entityPos.x,
          0,
          wanderTargetRef.current.z - entityPos.z
        );
        
        const distanceToTarget = wanderDirection.length();
        
        if (distanceToTarget > 0.5) {
          wanderDirection.normalize();
          const wanderSpeed = 2.0;
          const velocity = wanderDirection.clone().multiplyScalar(wanderSpeed * delta);

          // 次の位置を計算
          const nextPos = entityPos.clone().add(velocity);

          // 壁との衝突判定
          if (!checkWallCollision(nextPos)) {
            groupRef.current.position.copy(nextPos);
            groupRef.current.position.y = 0.5;
          } else {
            // 壁にぶつかったら新しい目標を設定
            wanderTargetRef.current = null;
          }

          // 移動方向を向く
          const angle = Math.atan2(wanderDirection.x, wanderDirection.z);
          groupRef.current.rotation.y = angle;
        } else {
          // 目標地点に到達したら新しい目標を設定
          wanderTargetRef.current = null;
        }
      }

      // エンティティの位置を親コンポーネントに報告
      if (onPositionUpdate && groupRef.current) {
        const now = Date.now();
        if (now - lastPositionUpdateTime.current > 200) {
          onPositionUpdate({
            x: groupRef.current.position.x,
            y: groupRef.current.position.y,
            z: groupRef.current.position.z
          });
          lastPositionUpdateTime.current = now;
        }
      }
      
      return;
    }
    
    const distance = Math.sqrt(
      Math.pow(playerPosition.x - entityPos.x, 2) +
      Math.pow(playerPosition.z - entityPos.z, 2)
    );

    // プレイヤーが30m以内にいるかチェック（範囲を広げた）
    const chaseRange = 30.0;
    const catchRange = 2.0; // 接触判定
    
    // デバッグ: 距離とモードを表示
    if (Math.random() < 0.01) { // 1%の確率でログ出力（スパム防止）
      console.log(`[Entity] Distance to player: ${distance.toFixed(2)}m, Mode: ${stateRef.current}`);
    }
    
    if (distance < catchRange) {
      // プレイヤーを捕まえた
      console.log('[Entity] Player caught!');
      onCatch();
      return;
    }

    if (distance < chaseRange) {
      // 追跡モード
      if (stateRef.current !== 'chasing') {
        console.log('[Entity] Entering chase mode! Distance:', distance.toFixed(2));
      }
      stateRef.current = 'chasing';
      
      // プレイヤーに向かう方向ベクトル
      const direction = new THREE.Vector3(
        playerPosition.x - entityPos.x,
        0,
        playerPosition.z - entityPos.z
      ).normalize();

      // 走るより少し遅い速度 (プレイヤーの走り速度が6.0なので5.5に設定)
      const chaseSpeed = 5.5;
      const velocity = direction.clone().multiplyScalar(chaseSpeed * delta);

      // 次の位置を計算
      const nextPos = entityPos.clone().add(velocity);

      // 壁との衝突判定
      if (!checkWallCollision(nextPos)) {
        // エンティティを移動
        groupRef.current.position.copy(nextPos);
        groupRef.current.position.y = 0.5; // Y座標を固定
      } else {
        // 壁にぶつかった場合、複数の回避方向を試す
        let moved = false;
        
        // X方向とZ方向を個別に試す
        const nextPosX = entityPos.clone();
        nextPosX.x += velocity.x;
        if (!checkWallCollision(nextPosX)) {
          groupRef.current.position.x = nextPosX.x;
          moved = true;
        }
        
        const nextPosZ = entityPos.clone();
        nextPosZ.z += velocity.z;
        if (!checkWallCollision(nextPosZ)) {
          groupRef.current.position.z = nextPosZ.z;
          moved = true;
        }
        
        // それでも動けない場合、斜め方向を試す
        if (!moved) {
          const angles = [Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
          for (const angleOffset of angles) {
            const currentAngle = Math.atan2(direction.x, direction.z);
            const newAngle = currentAngle + angleOffset;
            const slideDirection = new THREE.Vector3(
              Math.sin(newAngle),
              0,
              Math.cos(newAngle)
            ).normalize();
            
            const slideVelocity = slideDirection.multiplyScalar(chaseSpeed * delta);
            const slidePos = entityPos.clone().add(slideVelocity);
            
            if (!checkWallCollision(slidePos)) {
              groupRef.current.position.copy(slidePos);
              groupRef.current.position.y = 0.5;
              moved = true;
              break;
            }
          }
        }
      }

      // プレイヤーの方を向く
      const angle = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = angle;

    } else {
      // 徘徊モード
      stateRef.current = 'wandering';
      
      wanderTimeRef.current += delta;

      // 3秒ごとに新しいランダムな目標地点を設定
      if (!wanderTargetRef.current || wanderTimeRef.current > 3.0) {
        // ランダムな方向に移動
        const angle = Math.random() * Math.PI * 2;
        const distance = 5 + Math.random() * 5;
        wanderTargetRef.current = new THREE.Vector3(
          entityPos.x + Math.cos(angle) * distance,
          0.5,
          entityPos.z + Math.sin(angle) * distance
        );
        wanderTimeRef.current = 0;
      }

      // 目標地点に向かって移動
      if (wanderTargetRef.current) {
        const wanderDirection = new THREE.Vector3(
          wanderTargetRef.current.x - entityPos.x,
          0,
          wanderTargetRef.current.z - entityPos.z
        );
        
        const distanceToTarget = wanderDirection.length();
        
        if (distanceToTarget > 0.5) {
          wanderDirection.normalize();
          const wanderSpeed = 2.0;
          const velocity = wanderDirection.clone().multiplyScalar(wanderSpeed * delta);

          // 次の位置を計算
          const nextPos = entityPos.clone().add(velocity);

          // 壁との衝突判定
          if (!checkWallCollision(nextPos)) {
            groupRef.current.position.copy(nextPos);
            groupRef.current.position.y = 0.5; // Y座標を固定
          } else {
            // 壁にぶつかったら新しい目標を設定
            wanderTargetRef.current = null;
          }

          // 移動方向を向く
          const angle = Math.atan2(wanderDirection.x, wanderDirection.z);
          groupRef.current.rotation.y = angle;
        } else {
          // 目標地点に到達したら新しい目標を設定
          wanderTargetRef.current = null;
        }
      }
    }

    // エンティティの位置を親コンポーネントに報告（200msごとにthrottle）
    if (onPositionUpdate && groupRef.current) {
      const now = Date.now();
      if (now - lastPositionUpdateTime.current > 200) {
        onPositionUpdate({
          x: groupRef.current.position.x,
          y: groupRef.current.position.y,
          z: groupRef.current.position.z
        });
        lastPositionUpdateTime.current = now;
      }
    }
  });

  return (
    <group ref={groupRef} position={[position[0], 0.5, position[2]]}>
      {/* GLTFモデルコンテナ */}
      <group ref={modelRef} />
      
      {/* デバッグ用: 小さな球体を表示してエンティティの位置を確認（追跡モードで色が変わる） */}
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial 
          color={stateRef.current === 'chasing' ? '#ff0000' : '#00ff00'} 
          emissive={stateRef.current === 'chasing' ? '#ff0000' : '#00ff00'}
          emissiveIntensity={3.0}
        />
      </mesh>
      
      {/* エンティティの光源（常に表示） */}
      <pointLight 
        color={stateRef.current === 'chasing' ? '#ff0000' : '#ffaa00'} 
        intensity={stateRef.current === 'chasing' ? 5.0 : 2.0}
        distance={12}
        position={[0, 1.5, 0]}
        decay={2}
      />
    </group>
  );
}
