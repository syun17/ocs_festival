// src/components/MultiplayerManager.jsx
// マルチプレイヤー通信管理
// WebSocketを使って他プレイヤーの位置を同期する

import { useEffect, useRef, useCallback } from "react";

// スタンドアロンのマルチプレイヤーマネージャーコンポーネント
export default function MultiplayerManager({ 
  serverUrl = "ws://localhost:8080",
  mode, // "host" or "guest"
  roomId, // ルームID(ゲストの場合に必要)
  playerName,
  playerPosition, 
  onPlayersUpdate,
  onRoomCreated, // ホスト時にルームIDを返すコールバック
  onError,
  onNoclipTriggered,  // 新規: noclipイベント
  onLevelCompleteTriggered  // 新規: レベル完了イベント
}) {
  const wsRef = useRef(null);
  const playerIdRef = useRef(null);
  const currentRoomIdRef = useRef(roomId);
  const isConnectedRef = useRef(false); // 接続状態を追跡

  // コールバック関数をrefに保存して安定化
  const onPlayersUpdateRef = useRef(onPlayersUpdate);
  const onRoomCreatedRef = useRef(onRoomCreated);
  const onErrorRef = useRef(onError);
  const onNoclipTriggeredRef = useRef(onNoclipTriggered);
  const onLevelCompleteTriggeredRef = useRef(onLevelCompleteTriggered);

  useEffect(() => {
    onPlayersUpdateRef.current = onPlayersUpdate;
    onRoomCreatedRef.current = onRoomCreated;
    onErrorRef.current = onError;
    onNoclipTriggeredRef.current = onNoclipTriggered;
    onLevelCompleteTriggeredRef.current = onLevelCompleteTriggered;
  }, [onPlayersUpdate, onRoomCreated, onError, onNoclipTriggered, onLevelCompleteTriggered]);

  // Noclipイベントを送信する関数
  const sendNoclip = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "noclip" }));
      console.log("[MultiplayerManager] Sent noclip event");
    }
  }, []);

  // レベル完了イベントを送信する関数
  const sendLevelComplete = useCallback((level) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "level-complete", level }));
      console.log(`[MultiplayerManager] Sent level-complete event: ${level}`);
    }
  }, []);

  // 送信関数をwindowオブジェクトに公開（Game.jsxなどからアクセス可能に）
  useEffect(() => {
    window.multiplayerSendNoclip = sendNoclip;
    window.multiplayerSendLevelComplete = sendLevelComplete;
    
    return () => {
      delete window.multiplayerSendNoclip;
      delete window.multiplayerSendLevelComplete;
    };
  }, [sendNoclip, sendLevelComplete]);

  // プレイヤー位置を送信
  const sendPlayerUpdate = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && playerPosition) {
      const data = {
        type: "update",
        position: {
          x: playerPosition.x || 0,
          y: playerPosition.y || 1.6,
          z: playerPosition.z || 0
        }
      };
      wsRef.current.send(JSON.stringify(data));
    }
  }, [playerPosition]);

  // WebSocket接続
  useEffect(() => {
    if (!serverUrl) return;
    
    // 既に接続されている場合はスキップ
    if (isConnectedRef.current) return;

    let currentWs = null;

    const connect = () => {
      try {
        const ws = new WebSocket(serverUrl);
        wsRef.current = ws;
        currentWs = ws;

        ws.onopen = () => {
          console.log("[MultiplayerManager] Connected to server");
          isConnectedRef.current = true;
          
          // ホストの場合はルーム作成、ゲストの場合は参加
          if (mode === "host") {
            ws.send(JSON.stringify({ type: "create-room" }));
          } else if (mode === "guest" && roomId) {
            ws.send(JSON.stringify({ type: "join-room", roomId: roomId }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case "room-created":
                // ホストがルームを作成した
                playerIdRef.current = data.playerId;
                currentRoomIdRef.current = data.roomId;
                console.log(`[MultiplayerManager] Room created: ${data.roomId}, Player ID: ${data.playerId}`);
                if (onRoomCreatedRef.current) {
                  onRoomCreatedRef.current(data.roomId, data.playerId);
                }
                break;
                
              case "room-joined":
                // ゲストがルームに参加した
                playerIdRef.current = data.playerId;
                currentRoomIdRef.current = data.roomId;
                console.log(`[MultiplayerManager] Joined room: ${data.roomId}, Player ID: ${data.playerId}`);
                break;
                
              case "state":
                // プレイヤーの状態を受信
                if (onPlayersUpdateRef.current && data.players) {
                  // 自分以外のプレイヤーのみをフィルタ
                  const otherPlayers = data.players
                    .filter(p => p.id !== playerIdRef.current)
                    .map(p => ({
                      id: p.id,
                      position: [p.position.x, p.position.y, p.position.z],
                      rotation: 0, // サーバーから回転情報が来たら使用
                      name: playerName || "Player"
                    }));
                  onPlayersUpdateRef.current(otherPlayers);
                }
                break;
                
              case "error":
                console.error("[MultiplayerManager] Server error:", data.message);
                if (onErrorRef.current) {
                  onErrorRef.current(data.message);
                }
                break;
                
              case "trigger-noclip":
                // 他プレイヤーがnoclipをトリガー
                console.log(`[MultiplayerManager] Noclip triggered by player ${data.triggeredBy}`);
                if (onNoclipTriggeredRef.current) {
                  onNoclipTriggeredRef.current(data.triggeredBy);
                }
                break;
                
              case "trigger-level-complete":
                // 他プレイヤーがレベル完了をトリガー
                console.log(`[MultiplayerManager] Level "${data.level}" completed by player ${data.triggeredBy}`);
                if (onLevelCompleteTriggeredRef.current) {
                  onLevelCompleteTriggeredRef.current(data.level, data.triggeredBy);
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
          if (onErrorRef.current) {
            onErrorRef.current("WebSocket接続エラー");
          }
        };

        ws.onclose = () => {
          console.log("[MultiplayerManager] Disconnected from server");
          isConnectedRef.current = false;
        };
      } catch (error) {
        console.error("[MultiplayerManager] Failed to connect:", error);
        if (onErrorRef.current) {
          onErrorRef.current("サーバーに接続できません");
        }
      }
    };

    connect();

    return () => {
      isConnectedRef.current = false;
      if (currentWs) {
        currentWs.close();
      }
    };
  }, [serverUrl, mode, roomId, playerName]); // 関数参照を依存配列から削除

  // プレイヤー位置の定期送信
  useEffect(() => {
    const interval = setInterval(() => {
      sendPlayerUpdate();
    }, 100); // 100msごとに送信

    return () => clearInterval(interval);
  }, [sendPlayerUpdate]);

  return null;
}
