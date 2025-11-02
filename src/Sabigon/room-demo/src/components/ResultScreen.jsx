// src/components/ResultScreen.jsx

import React from "react";

export default function ResultScreen({ time, onRestart }) {
  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#0f0",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "monospace",
      }}
    >
      <h1 style={{ fontSize: "64px", marginBottom: "20px", textShadow: "0 0 20px #0f0" }}>
        🎉 ESCAPED! 🎉
      </h1>
      <p style={{ fontSize: "32px", marginBottom: "10px", color: "#fff" }}>
        あなたはBackroomsからの脱出に成功しました
      </p>
      <p style={{ fontSize: "28px", marginBottom: "40px", color: "#ff0" }}>
        生存時間: {time.toFixed(2)} 秒
      </p>
      <p style={{ fontSize: "20px", marginBottom: "40px", color: "#888" }}>
        Level 0 → Level ! (Run For Your Life!) をクリア
      </p>
      <button
        onClick={onRestart}
        style={{
          padding: "20px 40px",
          fontSize: "24px",
          cursor: "pointer",
          backgroundColor: "#0f0",
          color: "#000",
          border: "none",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        タイトルに戻る
      </button>
    </div>
  );
}
