// src/components/MultiplayerManager.jsx
// マルチプレイヤー通信管理
// WebSocketを使って他プレイヤーの位置を同期する

import { useEffect, useRef, useCallback } from "react";

// スタンドアロンのマルチプレイヤーマネージャーコンポーネント
export default function MultiplayerManager({ 
  serverUrl, 
  playerPosition, 
  onPlayersUpdate 
}) {
  const wsRef = useRef(null);
  const playerIdRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // プレイヤー位置を送信
  const sendPlayerUpdate = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && playerPosition) {
      const data = {
        type: "playerUpdate",
        playerId: playerIdRef.current,
        position: playerPosition.position,
        rotation: playerPosition.rotation,
        timestamp: Date.now()
      };
      wsRef.current.send(JSON.stringify(data));
    }
  }, [playerPosition]);

  // WebSocket接続
  useEffect(() => {
    if (!serverUrl) return;

    const connect = () => {
      try {
        const ws = new WebSocket(serverUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[MultiplayerManager] Connected to server");
          
          // 接続時にプレイヤーIDを要求
          ws.send(JSON.stringify({ type: "join" }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case "welcome":
                // サーバーから割り当てられたプレイヤーID
                playerIdRef.current = data.playerId;
                console.log(`[MultiplayerManager] Assigned player ID: ${data.playerId}`);
                break;
                
              case "playersUpdate":
                // 他プレイヤーのデータを受信
                if (onPlayersUpdate) {
                  // 自分以外のプレイヤーのみをフィルタ
                  const otherPlayers = data.players.filter(
                    p => p.id !== playerIdRef.current
                  );
                  onPlayersUpdate(otherPlayers);
                }
                break;
                
              default:
                console.log("[MultiplayerManager] Unknown message type:", data.type);
            }
          } catch (error) {
            console.error("[MultiplayerManager] Failed to parse message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("[MultiplayerManager] WebSocket error:", error);
        };

        ws.onclose = () => {
          console.log("[MultiplayerManager] Disconnected from server");
          
          // 5秒後に再接続を試みる
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log("[MultiplayerManager] Attempting to reconnect...");
            connect();
          }, 5000);
        };
      } catch (error) {
        console.error("[MultiplayerManager] Failed to connect:", error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [serverUrl, onPlayersUpdate]);

  // プレイヤー位置の定期送信
  useEffect(() => {
    const interval = setInterval(() => {
      sendPlayerUpdate();
    }, 100); // 100msごとに送信

    return () => clearInterval(interval);
  }, [sendPlayerUpdate]);

  return null;
}
