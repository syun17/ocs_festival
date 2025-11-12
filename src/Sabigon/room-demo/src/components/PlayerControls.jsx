import { useThree, useFrame } from "@react-three/fiber";
import { useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { PointerLockControls } from "@react-three/drei";
import { isColliding, wallPositions } from "../App";
 
function PlayerControls({ roomConfig }) {
  const { camera, scene } = useThree();
  const direction = useRef(new THREE.Vector3());
  const keys = useRef({});
  const socketRef = useRef(null);
  const otherPlayers = useRef({}); // 他プレイヤーの Mesh を保持
  const myId = useRef(null); // 自分のIDを保持
  const roomId = useRef(null); // ルームIDを保持
  const lastSentTime = useRef(0); // 送信間隔制御用
  const isConnected = useRef(false); // 接続状態
 
  const walkSpeed = 5.0;
  const runSpeed = 10.0;
  const SEND_INTERVAL = 50; // 50ms = 20回/秒
 
  // ルームID表示用の関数
  const removeRoomId = useCallback(() => {
    const existing = document.getElementById("room-id-display");
    if (existing) {
      existing.remove();
    }
  }, []);
  
  const showRoomId = useCallback((id) => {
    // 既存の表示を削除
    removeRoomId();
    
    const roomIdDiv = document.createElement("div");
    roomIdDiv.id = "room-id-display";
    roomIdDiv.style.cssText = `
      position: fixed;
      top: 80px;
      left: 20px;
      background-color: rgba(0, 0, 0, 0.8);
      color: #4CAF50;
      padding: 15px 20px;
      border-radius: 5px;
      font-size: 24px;
      font-weight: bold;
      z-index: 1000;
      border: 2px solid #4CAF50;
    `;
    roomIdDiv.innerHTML = `ルームID: ${id}`;
    document.body.appendChild(roomIdDiv);
  }, [removeRoomId]);
 
  // === WebSocket接続 ===
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;
 
    socket.onopen = () => {
      console.log("✅ Connected to WebSocket server");
      isConnected.current = true;
      
      // ルーム作成または参加
      if (roomConfig.mode === "host") {
        socket.send(JSON.stringify({ type: "create-room" }));
      } else if (roomConfig.mode === "join") {
        socket.send(JSON.stringify({ 
          type: "join-room", 
          roomId: roomConfig.roomId 
        }));
      }
    };
 
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === "room-created") {
        myId.current = data.playerId;
        roomId.current = data.roomId;
        console.log("🏠 Room created! Room ID:", data.roomId);
        console.log("🎮 My player ID:", data.playerId);
        // ルームIDを画面に表示
        showRoomId(data.roomId);
      } else if (data.type === "room-joined") {
        myId.current = data.playerId;
        roomId.current = data.roomId;
        console.log("👥 Joined room:", data.roomId);
        console.log("🎮 My player ID:", data.playerId);
      } else if (data.type === "state") {
        updateOtherPlayers(data.players);
      } else if (data.type === "error") {
        console.error("❌ Server error:", data.message);
        alert("エラー: " + data.message);
      }
    };
 
    socket.onerror = (error) => console.error("❌ WebSocket error:", error);
    socket.onclose = () => {
      console.log("❌ Disconnected from server");
      isConnected.current = false;
    };
 
    return () => {
      socket.close();
      // 接続終了時に他プレイヤーのメッシュを削除
      Object.values(otherPlayers.current).forEach((mesh) => {
        scene.remove(mesh);
      });
      otherPlayers.current = {};
      // ルームID表示を削除
      removeRoomId();
    };
  }, [scene, roomConfig, showRoomId, updateOtherPlayers, removeRoomId]);
 
  // === 他プレイヤーの更新処理 ===
  const updateOtherPlayers = useCallback((players) => {
    // 各プレイヤーを処理
    players.forEach(({ id, position }) => {
      // 自分自身はスキップ
      if (id === myId.current) return;
 
      // 既存 Mesh がなければ作成
      if (!otherPlayers.current[id]) {
        const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8); // プレイヤーサイズ
        const material = new THREE.MeshStandardMaterial({ 
          color: 0x00ff00,
          emissive: 0x004400
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.9; // 地面に足を合わせる
        scene.add(mesh);
        otherPlayers.current[id] = mesh;
        console.log("👤 Other player joined:", id);
      }
      
      // 位置を滑らかに補間
      const mesh = otherPlayers.current[id];
      mesh.position.lerp(
        new THREE.Vector3(position.x, position.y, position.z),
        0.3 // 補間係数
      );
    });
 
    // 退出プレイヤー削除
    Object.keys(otherPlayers.current).forEach((id) => {
      if (!players.find((p) => p.id === id)) {
        scene.remove(otherPlayers.current[id]);
        delete otherPlayers.current[id];
        console.log("👋 Other player left:", id);
      }
    });
  }, [scene]);
 
  // === キー入力処理 ===
  useEffect(() => {
    const handleKeyDown = (e) => (keys.current[e.code] = true);
    const handleKeyUp = (e) => (keys.current[e.code] = false);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);
 
  // === 移動処理 + サーバ送信 ===
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
    move.addScaledVector(front, direction.current.z);
    move.addScaledVector(right, direction.current.x);
 
    const isRunning =
      keys.current["ShiftLeft"] ||
      keys.current["ShiftRight"] ||
      keys.current["Shift"];
    const speed = isRunning ? runSpeed : walkSpeed;
 
    let hasMoved = false;
 
    if (move.length() > 0) {
      move.setLength(speed * delta);
 
      const currentPos = camera.position.clone();
 
      // X方向
      const posX = currentPos.clone().add(new THREE.Vector3(move.x, 0, 0));
      if (!isColliding(posX, wallPositions)) {
        camera.position.x += move.x;
        hasMoved = true;
      }
 
      // Z方向
      const posZ = currentPos.clone().add(new THREE.Vector3(0, 0, move.z));
      if (!isColliding(posZ, wallPositions)) {
        camera.position.z += move.z;
        hasMoved = true;
      }
    }
 
    // === サーバへ現在位置を送信(間引き) ===
    const now = Date.now();
    if (
      hasMoved &&
      socketRef.current?.readyState === WebSocket.OPEN &&
      now - lastSentTime.current > SEND_INTERVAL
    ) {
      socketRef.current.send(
        JSON.stringify({
          type: "update",
          position: {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z,
          },
        })
      );
      lastSentTime.current = now;
    }
  });
 
  return <PointerLockControls />;
}
 
export default PlayerControls;