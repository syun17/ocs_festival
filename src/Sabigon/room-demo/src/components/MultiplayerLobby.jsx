// src/components/MultiplayerLobby.jsx
// マルチプレイのロビー画面（ルーム作成・参加）

import React, { useState } from "react";

export default function MultiplayerLobby({ onStartGame }) {
  const [mode, setMode] = useState(null); // null | "host" | "join"
  const [roomId, setRoomId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError("プレイヤー名を入力してください");
      return;
    }
    setError("");
    onStartGame({
      mode: "host",
      playerName: playerName.trim(),
      roomId: null
    });
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError("プレイヤー名を入力してください");
      return;
    }
    if (!roomId.trim() || roomId.length !== 4) {
      setError("4桁のルームIDを入力してください");
      return;
    }
    setError("");
    onStartGame({
      mode: "guest",
      playerName: playerName.trim(),
      roomId: roomId.trim()
    });
  };

  if (mode === null) {
    return (
      <div style={styles.container}>
        <div style={styles.panel}>
          <h1 style={styles.title}>🎮 マルチプレイモード</h1>
          <p style={styles.subtitle}>協力して脱出しよう!</p>
          
          <div style={styles.buttonGroup}>
            <button
              onClick={() => setMode("host")}
              style={{...styles.button, ...styles.createButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#00ff00"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#00cc00"}
            >
              🏠 ルームを作成
            </button>
            
            <button
              onClick={() => setMode("join")}
              style={{...styles.button, ...styles.joinButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#0088ff"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#0066cc"}
            >
              👥 ルームに参加
            </button>
          </div>
          
          <button
            onClick={() => window.location.href = "/"}
            style={{...styles.button, ...styles.backButton}}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#666"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#444"}
          >
            ← 戻る
          </button>
        </div>
      </div>
    );
  }

  if (mode === "host") {
    return (
      <div style={styles.container}>
        <div style={styles.panel}>
          <h1 style={styles.title}>🏠 ルームを作成</h1>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>プレイヤー名:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              maxLength={12}
              style={styles.input}
            />
          </div>
          
          {error && <p style={styles.error}>{error}</p>}
          
          <div style={styles.buttonGroup}>
            <button
              onClick={handleCreateRoom}
              style={{...styles.button, ...styles.primaryButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#00ff00"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#00cc00"}
            >
              ルーム作成
            </button>
            
            <button
              onClick={() => setMode(null)}
              style={{...styles.button, ...styles.backButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#666"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#444"}
            >
              ← 戻る
            </button>
          </div>
          
          <div style={styles.info}>
            <p>📌 ルームIDが自動生成されます</p>
            <p>📌 フレンドにルームIDを共有してください</p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div style={styles.container}>
        <div style={styles.panel}>
          <h1 style={styles.title}>👥 ルームに参加</h1>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>プレイヤー名:</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="名前を入力"
              maxLength={12}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>ルームID (4桁):</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              maxLength={4}
              style={styles.input}
            />
          </div>
          
          {error && <p style={styles.error}>{error}</p>}
          
          <div style={styles.buttonGroup}>
            <button
              onClick={handleJoinRoom}
              style={{...styles.button, ...styles.primaryButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#0088ff"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#0066cc"}
            >
              参加
            </button>
            
            <button
              onClick={() => setMode(null)}
              style={{...styles.button, ...styles.backButton}}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#666"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#444"}
            >
              ← 戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    fontFamily: "monospace",
    position: "relative",
    zIndex: 1000
  },
  panel: {
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    border: "3px solid #00ff00",
    borderRadius: "10px",
    padding: "40px",
    maxWidth: "500px",
    width: "90%",
    boxShadow: "0 0 30px rgba(0, 255, 0, 0.5)",
    textAlign: "center",
    position: "relative",
    zIndex: 1001
  },
  title: {
    color: "#00ff00",
    fontSize: "32px",
    marginBottom: "10px",
    textShadow: "0 0 10px #00ff00"
  },
  subtitle: {
    color: "#ffffff",
    fontSize: "16px",
    marginBottom: "30px"
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginTop: "20px"
  },
  button: {
    padding: "15px 30px",
    fontSize: "18px",
    fontWeight: "bold",
    border: "2px solid #ffffff",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "all 0.3s",
    fontFamily: "monospace",
    color: "#000",
    backgroundColor: "#00cc00"
  },
  createButton: {
    backgroundColor: "#00cc00"
  },
  joinButton: {
    backgroundColor: "#0066cc"
  },
  primaryButton: {
    backgroundColor: "#00cc00"
  },
  backButton: {
    backgroundColor: "#444",
    color: "#fff"
  },
  inputGroup: {
    marginBottom: "20px",
    textAlign: "left"
  },
  label: {
    display: "block",
    color: "#00ff00",
    fontSize: "16px",
    marginBottom: "8px"
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "18px",
    fontFamily: "monospace",
    border: "2px solid #00ff00",
    borderRadius: "5px",
    backgroundColor: "#000",
    color: "#00ff00",
    outline: "none",
    boxSizing: "border-box"
  },
  error: {
    color: "#ff0000",
    fontSize: "14px",
    marginTop: "10px",
    textShadow: "0 0 5px #ff0000"
  },
  info: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    borderRadius: "5px",
    border: "1px solid #00ff00"
  }
};
