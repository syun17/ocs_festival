// src/components/GameOverScreen.jsx
// ホラー演出付きゲームオーバー画面

import React, { useEffect, useRef, useState } from 'react';
import './gameover-screen.css';

export default function GameOverScreen({ onRestart }) {
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [showText, setShowText] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    // ホラー演出用のグリッチ
    const glitchInterval = setInterval(() => {
      setGlitchIntensity(Math.random());
    }, 100);

    // テキスト表示遅延
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1000);

    // 静的ノイズアニメーション
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId;
    const drawNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;         // R
        data[i + 1] = noise * 0.3; // G
        data[i + 2] = noise * 0.3; // B
        data[i + 3] = 100;         // A
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(drawNoise);
    };

    drawNoise();

    // ホラーサウンドエフェクト再生
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(textTimer);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="gameover-container">
      {/* 赤黒い背景 */}
      <div className="gameover-background" />
      
      {/* 静的ノイズ */}
      <canvas 
        ref={canvasRef} 
        className="gameover-noise"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* グリッチエフェクト */}
      <div 
        className="gameover-glitch"
        style={{
          opacity: glitchIntensity * 0.5,
          transform: `translate(${(Math.random() - 0.5) * 30}px, ${(Math.random() - 0.5) * 30}px)`,
        }}
      />

      {/* エンティティの影 */}
      <div className="entity-shadow" style={{ opacity: glitchIntensity * 0.3 }} />

      {/* メインコンテンツ */}
      <div className={`gameover-content ${showText ? 'show' : ''}`}>
        <h1 className="gameover-title">YOU DIED</h1>
        <p className="gameover-subtitle">The Entity has claimed another victim...</p>
        
        <div className="gameover-buttons">
          <button 
            className="gameover-button restart"
            onClick={onRestart}
          >
            TRY AGAIN
          </button>
          <button 
            className="gameover-button menu"
            onClick={() => window.location.reload()}
          >
            MAIN MENU
          </button>
        </div>

        <p className="gameover-hint">
          💡 Tip: Run when you hear the Entity nearby. Stay quiet and find the exit door.
        </p>
      </div>

      {/* ビネット効果 */}
      <div className="gameover-vignette" style={{ pointerEvents: 'none' }} />
      
      {/* ホラーサウンド (オプション) */}
      <audio ref={audioRef}>
        <source src="/src/effect/sounds/Texture_Ambi02-2.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
}
