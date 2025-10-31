// src/components/VHSEffect.jsx
// VHS/CRT画面エフェクト

import React, { useEffect, useRef } from 'react';
import '../effect/vhs-effect.css';

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function VHSEffect({ children, noiseIntensity = 0.5 }) {
  const vcrCanvasRef = useRef(null);
  const snowCanvasRef = useRef(null);
  const vcrIntervalRef = useRef(null);
  const snowFrameRef = useRef(null);
  const lastSnowUpdate = useRef(0);
  const lastVcrUpdate = useRef(0);
  const noiseIntensityRef = useRef(noiseIntensity); // refで管理

  // noiseIntensityが変更されたらrefを更新（再初期化は不要）
  useEffect(() => {
    noiseIntensityRef.current = noiseIntensity;
  }, [noiseIntensity]);

  useEffect(() => {
    const vcrCanvas = vcrCanvasRef.current;
    const snowCanvas = snowCanvasRef.current;
    
    if (!vcrCanvas || !snowCanvas) return;

    const vcrCtx = vcrCanvas.getContext('2d');
    const snowCtx = snowCanvas.getContext('2d');

    // キャンバスサイズを設定
    const updateSize = () => {
      vcrCanvas.width = window.innerWidth;
      vcrCanvas.height = window.innerHeight;
      snowCanvas.width = window.innerWidth / 2;
      snowCanvas.height = window.innerHeight / 2;
    };

    updateSize();

    // VCRノイズ生成
    const renderTrackingNoise = (radius = 2) => {
      const config = {
        miny: 220,
        maxy: vcrCanvas.height,
        miny2: 220,
        num: 70,
        blur: 1
      };

      let posy1 = config.miny || 0;
      let posy2 = config.maxy || vcrCanvas.height;
      let posy3 = config.miny2 || 0;
      const num = config.num || 20;
      const xmax = vcrCanvas.width;

      vcrCanvas.style.filter = `blur(${config.blur}px)`;
      vcrCtx.clearRect(0, 0, vcrCanvas.width, vcrCanvas.height);
      vcrCtx.fillStyle = '#fff';

      vcrCtx.beginPath();
      for (let i = 0; i <= num; i++) {
        const x = Math.random() * xmax;
        const y1 = getRandomInt(posy1 += 3, posy2);
        const y2 = getRandomInt(0, posy3 -= 3);
        vcrCtx.fillRect(x, y1, radius, radius);
        vcrCtx.fillRect(x, y2, radius, radius);
        vcrCtx.fill();

        renderTail(vcrCtx, x, y1, radius);
        renderTail(vcrCtx, x, y2, radius);
      }
      vcrCtx.closePath();
    };

    const renderTail = (ctx, x, y, radius) => {
      const n = getRandomInt(1, 50);
      const dirs = [1, -1];
      let rd = radius;
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      
      for (let i = 0; i < n; i++) {
        const step = 0.01;
        let r = getRandomInt((rd -= step), radius);
        let dx = getRandomInt(1, 4);
        radius -= 0.1;
        dx *= dir;
        ctx.fillRect((x += dx), y, r, r);
        ctx.fill();
      }
    };

    // スノーノイズ生成（強度を可変に）
    const generateSnow = () => {
      const w = snowCanvas.width;
      const h = snowCanvas.height;
      const d = snowCtx.createImageData(w, h);
      const b = new Uint32Array(d.data.buffer);
      const len = b.length;

      // noiseIntensityRefを使用（再初期化なしで値を参照）
      const threshold = 1 - noiseIntensityRef.current;
      for (let i = 0; i < len; i++) {
        if (Math.random() > threshold) {
          b[i] = ((255 * Math.random()) | 0) << 24;
        }
      }

      snowCtx.putImageData(d, 0, 0);
    };

    // アニメーション（フレームレート制限付き）
    const animateSnow = () => {
      const now = Date.now();
      // 30FPSに制限（約33ms間隔）
      if (now - lastSnowUpdate.current > 33) {
        generateSnow();
        lastSnowUpdate.current = now;
      }
      snowFrameRef.current = requestAnimationFrame(animateSnow);
    };

    const animateVCR = () => {
      const now = Date.now();
      // 20FPSに制限（50ms間隔）
      if (now - lastVcrUpdate.current > 50) {
        renderTrackingNoise();
        lastVcrUpdate.current = now;
      }
      vcrIntervalRef.current = requestAnimationFrame(animateVCR);
    };

    // 開始
    animateSnow();
    animateVCR();

    // リサイズ対応
    window.addEventListener('resize', updateSize);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', updateSize);
      if (snowFrameRef.current) {
        cancelAnimationFrame(snowFrameRef.current);
      }
      if (vcrIntervalRef.current) {
        cancelAnimationFrame(vcrIntervalRef.current);
      }
    };
  }, []); // 依存配列を空にして一度だけ実行

  return (
    <div className="vhs-container">
      <div className="screen-wrapper">
        <div className="screen-content wobbley">
          {children}
          
          {/* VCRノイズ */}
          <canvas 
            ref={vcrCanvasRef} 
            className="vcr" 
            style={{ 
              pointerEvents: 'none',
              opacity: 0.3 + (noiseIntensity * 0.4) // 0.3-0.7の範囲で変化
            }}
          />
          
          {/* スノーノイズ */}
          <canvas 
            ref={snowCanvasRef} 
            className="snow" 
            style={{ 
              pointerEvents: 'none',
              opacity: 0.1 + (noiseIntensity * 0.3) // 0.1-0.4の範囲で変化
            }}
          />
          
          {/* スキャンライン */}
          <div 
            className="scanlines" 
            style={{ 
              pointerEvents: 'none',
              opacity: 0.5 + (noiseIntensity * 0.3) // 0.5-0.8の範囲で変化
            }} 
          />
          
          {/* ビネット */}
          <div className="vignette" style={{ pointerEvents: 'none' }} />
        </div>
      </div>
    </div>
  );
}

export default VHSEffect;
