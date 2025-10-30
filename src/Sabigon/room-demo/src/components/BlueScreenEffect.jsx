import React, { useEffect, useRef, useState } from 'react';
import './blue-screen-effect.css';

const BlueScreenEffect = ({ duration = 2000, onComplete }) => {
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const vcrGlitchRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // BGMを再生
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
      audio.play().catch(err => console.log('Audio play failed:', err));
    }

    return () => {
      // クリーンアップ時に音声を停止
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    // jQueryを使用したVCRスクロールアニメーション
    if (window.$ && vcrGlitchRef.current) {
      let scrollPos = 0;
      const scrollInterval = setInterval(() => {
        // スクロール位置を自動的に増やす（ランダムな速度で）
        scrollPos += Math.random() * 200 + 100;
        // 1080の倍数に丸める
        const yPos = Math.round((scrollPos * 100) / 1080) * 1080;
        // 背景位置を適用
        const coords = '0% -' + yPos + 'px';
        window.$(vcrGlitchRef.current).css("background-position", coords);
      }, 50);

      // クリーンアップ
      return () => clearInterval(scrollInterval);
    }
  }, []);

  useEffect(() => {
    // グリッチアニメーション - ランダムな強度
    const glitchInterval = setInterval(() => {
      setGlitchIntensity(Math.random());
    }, 50);

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
        const noise = Math.random() * 30; // 弱めのノイズ
        data[i] = 20 + noise;     // R - 青みがかった暗い色
        data[i + 1] = 40 + noise; // G
        data[i + 2] = 100 + noise; // B - 青を強調
        data[i + 3] = 255;         // A
      }

      ctx.putImageData(imageData, 0, 0);
      animationId = requestAnimationFrame(drawNoise);
    };

    drawNoise();

    // 完了時のコールバック
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, duration);

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(timer);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [duration, onComplete]);

  return (
    <div className="blue-screen-container" ref={containerRef}>
      {/* ベースの青いスクリーン */}
      <div className="blue-screen-base" />
      
      {/* VCRスタイルのグリッチ画像アニメーション */}
      <div 
        ref={vcrGlitchRef}
        className="vcr-glitch"
        style={{
          backgroundImage: 'url(/textures/backrooms/glitch/vcr.jpg)',
          opacity: glitchIntensity * 0.6,
        }}
      />
      
      {/* 静的ノイズ */}
      <canvas 
        ref={canvasRef} 
        className="blue-screen-noise"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* グリッチエフェクト */}
      <div 
        className="blue-screen-glitch"
        style={{
          opacity: glitchIntensity,
          transform: `translateX(${(Math.random() - 0.5) * 20 * glitchIntensity}px)`,
        }}
      />
      
      {/* 水平グリッチライン */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="glitch-line"
          style={{
            top: `${Math.random() * 100}%`,
            height: `${2 + Math.random() * 4}px`,
            opacity: glitchIntensity * 0.7,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      
      {/* カメラUI要素 */}
      <div className="camera-ui">
        <div className="camera-text">
          <div className="rec-indicator">
            <span className="rec-dot"></span>
            REC
          </div>
          <div className="stage-info">Stage #2</div>
        </div>
        
        <div className="camera-status">
          <div className="battery-indicator">
            <div className="battery-bars">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div className="sp-indicator">SP</div>
        </div>
      </div>
      
      {/* ビネット効果 */}
      <div className="blue-screen-vignette" style={{ pointerEvents: 'none' }} />
      
      {/* BGM */}
      <audio ref={audioRef} loop>
        <source src="/src/effect/sounds/White_Noise01-3(Loop).mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default BlueScreenEffect;
