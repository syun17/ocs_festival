// src/components/StartScreen.jsx

import React, { useState } from "react";
import MultiplayerLobby from "./MultiplayerLobby";

export default function StartScreen({ onStart }) {
  const [mode, setMode] = useState("select"); // "select", "multiplayer"

  // マルチプレイロビーを表示
  if (mode === "multiplayer") {
    return (
      <MultiplayerLobby 
        onStartGame={(config) => {
          onStart(config);
        }}
      />
    );
  }

  // シングルプレイまたはマルチプレイ選択画面
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
      <h1 style={{ fontSize: "48px", marginBottom: "40px" }}>Maze game</h1>
      <p style={{ fontSize: "20px", marginBottom: "40px", color: "#888" }}>
        Maze game too easy
      </p>
      
      <button
        onClick={() => onStart({ mode: "single" })}
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
        🎮 シングルプレイ
      </button>
      
      <button
        onClick={() => setMode("multiplayer")}
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
        👥 マルチプレイ
      </button>
    </div>
  );
}
