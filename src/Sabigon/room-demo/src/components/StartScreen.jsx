// src/components/StartScreen.jsx

import React, { useState } from "react";

export default function StartScreen({ onStart }) {
  const [mode, setMode] = useState("select"); // "select", "host", "join"
  const [roomId, setRoomId] = useState("");

  if (mode === "host") {
    return (
      <div
        style={{
          backgroundColor: "#000",
          color: "#fff",
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "48px", marginBottom: "40px" }}>ホストとしてプレイ</h1>
        <p style={{ fontSize: "20px", marginBottom: "20px" }}>
          ルームを作成中...
        </p>
        <button
          onClick={() => {
            setMode("select");
          }}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div
        style={{
          backgroundColor: "#000",
          color: "#fff",
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: "48px", marginBottom: "40px" }}>ルームに参加</h1>
        <p style={{ fontSize: "20px", marginBottom: "20px" }}>
          ルームIDを入力してください
        </p>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="例: 1234"
          style={{
            padding: "15px",
            fontSize: "24px",
            width: "300px",
            marginBottom: "20px",
            textAlign: "center",
          }}
          maxLength={4}
        />
        <button
          onClick={() => {
            if (roomId.length === 4) {
              onStart({ mode: "join", roomId });
            } else {
              alert("4桁のルームIDを入力してください");
            }
          }}
          style={{
            padding: "20px 40px",
            fontSize: "24px",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          参加
        </button>
        <button
          onClick={() => {
            setMode("select");
            setRoomId("");
          }}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            cursor: "pointer",
          }}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ fontSize: "48px", marginBottom: "40px" }}>Maze Game</h1>
      <button
        onClick={() => onStart({ mode: "host" })}
        style={{
          padding: "20px 40px",
          fontSize: "24px",
          cursor: "pointer",
          marginBottom: "20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        ホストとして開始
      </button>
      <button
        onClick={() => setMode("join")}
        style={{
          padding: "20px 40px",
          fontSize: "24px",
          cursor: "pointer",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        ルームに参加
      </button>
    </div>
  );
}
