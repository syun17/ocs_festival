const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

const rooms = new Map(); // { roomId: { host: playerId, players: Map<playerId, {socket, position}> } }
const playerToRoom = new Map(); // { playerId: roomId }

server.on("connection", (socket) => {
  const playerId = generateId();
  
  console.log(`✅ Player ${playerId} connected`);
  
  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === "create-room") {
        // ホストがルームを作成
        const roomId = generateRoomId();
        rooms.set(roomId, {
          host: playerId,
          players: new Map([[playerId, { socket, position: { x: 0, y: 1, z: 0 } }]])
        });
        playerToRoom.set(playerId, roomId);
        
        socket.send(JSON.stringify({ 
          type: "room-created", 
          roomId, 
          playerId 
        }));
        
        console.log(`🏠 Room ${roomId} created by player ${playerId}`);
        
      } else if (data.type === "join-room") {
        // ゲストがルームに参加
        const roomId = data.roomId;
        
        if (!rooms.has(roomId)) {
          socket.send(JSON.stringify({ 
            type: "error", 
            message: "Room not found" 
          }));
          return;
        }
        
        const room = rooms.get(roomId);
        
        if (room.players.size >= 2) {
          socket.send(JSON.stringify({ 
            type: "error", 
            message: "Room is full" 
          }));
          return;
        }
        
        room.players.set(playerId, { socket, position: { x: 0, y: 1, z: 0 } });
        playerToRoom.set(playerId, roomId);
        
        socket.send(JSON.stringify({ 
          type: "room-joined", 
          roomId, 
          playerId 
        }));
        
        console.log(`👥 Player ${playerId} joined room ${roomId}`);
        
        // ルーム内の全プレイヤーに状態を送信
        broadcastToRoom(roomId);
        
      } else if (data.type === "update" && data.position) {
        // プレイヤーの位置を更新
        const roomId = playerToRoom.get(playerId);
        
        if (!roomId || !rooms.has(roomId)) return;
        
        const room = rooms.get(roomId);
        const player = room.players.get(playerId);
        
        if (player) {
          player.position = data.position;
          
          // 位置情報のログを出力
          console.log(`📍 Player ${playerId} in room ${roomId} moved to: x=${data.position.x.toFixed(2)}, y=${data.position.y.toFixed(2)}, z=${data.position.z.toFixed(2)}`);
          
          // ルーム内の全クライアントに状態をブロードキャスト
          broadcastToRoom(roomId);
        }
      }
    } catch (error) {
      console.error("❌ Message parse error:", error);
    }
  });
  
  socket.on("close", () => {
    const roomId = playerToRoom.get(playerId);
    
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.players.delete(playerId);
      
      console.log(`❌ Player ${playerId} disconnected from room ${roomId}`);
      
      // ルームが空になったら削除
      if (room.players.size === 0) {
        rooms.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted (empty)`);
      } else {
        broadcastToRoom(roomId);
      }
    }
    
    playerToRoom.delete(playerId);
  });
});

function broadcastToRoom(roomId) {
  if (!rooms.has(roomId)) return;
  
  const room = rooms.get(roomId);
  const state = {
    type: "state",
    players: Array.from(room.players.entries()).map(([id, data]) => ({
      id,
      position: data.position,
    })),
  };
  
  room.players.forEach((playerData) => {
    if (playerData.socket.readyState === WebSocket.OPEN) {
      playerData.socket.send(JSON.stringify(state));
    }
  });
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function generateRoomId() {
  // 4桁の数字のルームIDを生成
  return Math.floor(1000 + Math.random() * 9000).toString();
}

console.log("🚀 WebSocket server running on ws://localhost:8080");
