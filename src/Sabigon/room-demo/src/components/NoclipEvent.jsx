// src/components/NoclipEvent.jsx
// Noclipイベント管理

import React from "react";

export class NoclipManager {
  constructor() {
    this.stepCount = 0;
    // デバッグ用: 0.05 (5%の確率) 
    // 本番用: 0.001 (0.1%の確率、1000歩に1回程度)
    this.noclipProbability = 0.001;
    this.hasNoclipped = false;
  }

  // 一歩歩いた時の判定
  checkNoclip() {
    if (this.hasNoclipped) return false;

    this.stepCount++;
    
    // ランダムでnoclipが発生するか判定
    if (Math.random() < this.noclipProbability) {
      this.hasNoclipped = true;
      return true;
    }
    
    return false;
  }

  reset() {
    this.stepCount = 0;
    this.hasNoclipped = false;
  }

  getStepCount() {
    return this.stepCount;
  }
}

// Noclipローディング画面コンポーネント
export function NoclipLoadingScreen({ onLoadComplete }) {
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [glitchText, setGlitchText] = React.useState("LOADING");

  React.useEffect(() => {
    // グリッチエフェクト
    const glitchInterval = setInterval(() => {
      const glitchChars = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`";
      const randomGlitch = Array.from({ length: 7 })
        .map(() => Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : "█")
        .join("");
      setGlitchText(Math.random() > 0.3 ? "LOADING" : randomGlitch);
    }, 100);

    // ローディングプログレス
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(glitchInterval);
          setTimeout(() => onLoadComplete(), 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => {
      clearInterval(glitchInterval);
      clearInterval(progressInterval);
    };
  }, [onLoadComplete]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        fontFamily: "monospace",
      }}
    >
      <div
        style={{
          fontSize: "48px",
          color: "#ffff00",
          textShadow: "0 0 10px #ffff00, 0 0 20px #ffff00",
          marginBottom: "40px",
          animation: "flicker 0.15s infinite",
        }}
      >
        {glitchText}
      </div>
      
      <div
        style={{
          width: "60%",
          height: "30px",
          backgroundColor: "#222",
          border: "2px solid #ffff00",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${loadingProgress}%`,
            height: "100%",
            backgroundColor: "#ffff00",
            transition: "width 0.2s",
            boxShadow: "0 0 10px #ffff00",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "20px",
          color: "#ffff00",
          fontSize: "18px",
        }}
      >
        {Math.floor(loadingProgress)}%
      </div>

      <div
        style={{
          marginTop: "40px",
          color: "#ff0000",
          fontSize: "24px",
          textAlign: "center",
          maxWidth: "80%",
        }}
      >
        You've noclipped into the Backrooms...
      </div>

      <style>
        {`
          @keyframes flicker {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
        `}
      </style>
    </div>
  );
}

export default NoclipManager;
