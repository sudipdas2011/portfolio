import React, { useEffect, useRef } from "react";

export default function AsciiTrailCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const cellMemoryRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles = [];
    const maxParticles = 120; 
    /*const asciiChars = "ツ*°•. ";*/
    const asciiChars = "@#/*_-. ";

    let cols = Math.floor(width / 11);
    let rows = Math.floor(height / 16);

    const resetMemoryGrid = (c, r) => {
      cellMemoryRef.current = Array.from({ length: r }, () => new Array(c).fill(0));
    };
    resetMemoryGrid(cols, rows);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      cols = Math.floor(width / 11);
      rows = Math.floor(height / 16);
      resetMemoryGrid(cols, rows);
    };

    const handleMouseMove = (e) => {
      const bounds = canvas.getBoundingClientRect();
      const mx = e.clientX - bounds.left;
      const my = e.clientY - bounds.top;
      
      mouseRef.current.x = mx;
      mouseRef.current.y = my;

      if (particles.length < maxParticles) {
        particles.push({
          x: mx,
          y: my,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          radius: Math.random() * 85 + 65, 
          alpha: 1,
          seed: Math.random() * 100,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;
    const renderLoop = () => {
      time += 0.04;

      // -------------------------------------------------------------
      // 1. GENERATE PERFECT CENTERED MASSIVE SMILEY MASK
      // -------------------------------------------------------------
      ctx.clearRect(0, 0, width, height);
      
      // Safety threshold boundary limits (link headers finish around top 45%)
      const contentSafetyCeiling = height * 0.45; 
      const availableDrawingHeight = height - contentSafetyCeiling;

      // Font size matches exactly the available vertical clear window space
      const fontSize = Math.floor(availableDrawingHeight * 0.95); 
      
      ctx.font = `bold ${fontSize}px Arial, Helvetica, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#000000";

      // Perfect axis horizontal screen centering + pocket height padding
      const targetX = width / 2;
      const targetY = contentSafetyCeiling + (availableDrawingHeight / 2) + 20; 

      ctx.fillText("ツ", targetX, targetY);

      const smileyImageData = ctx.getImageData(0, 0, width, height).data;
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 2. GENERATE MOUSE TRAIL GRADIENT BLOBS
      // -------------------------------------------------------------
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx + Math.sin(time + p.seed) * 0.4;
        p.y += p.vy + Math.cos(time + p.seed) * 0.4;
        p.alpha -= 0.02; 

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        gradient.addColorStop(0, `rgba(0, 0, 0, ${p.alpha})`);
        gradient.addColorStop(0.5, `rgba(0, 0, 0, ${p.alpha * 0.4})`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      const trailImageData = ctx.getImageData(0, 0, width, height).data;
      ctx.clearRect(0, 0, width, height);

      // -------------------------------------------------------------
      // 3. DRAW DYNAMIC ASCII OVERLAY
      // -------------------------------------------------------------
      ctx.font = "bold 13px monospace";
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const pixelX = Math.floor(c * cellW + cellW / 2);
          const pixelY = Math.floor(r * cellH + cellH / 2);
          
          if (pixelX >= width || pixelY >= height) continue;
          
          const index = (pixelY * width + pixelX) * 4;
          const trailAlpha = trailImageData[index + 3];
          const isInsideSmiley = smileyImageData[index + 3] > 20;

          if (cellMemoryRef.current[r] && cellMemoryRef.current[r][c] > 0) {
            cellMemoryRef.current[r][c] -= 0.005; 
          }

          if (trailAlpha > 15 && isInsideSmiley) {
            cellMemoryRef.current[r][c] = 1.0; 
          }

          const currentMemory = cellMemoryRef.current[r] ? cellMemoryRef.current[r][c] : 0;
          const noiseVal = Math.sin(c * 0.15 + time) * Math.cos(r * 0.15 + time);

          if (isInsideSmiley && currentMemory > 0) {
            const staticNoiseIdx = Math.abs(Math.floor(noiseVal * 3)) % (asciiChars.length - 1);
            ctx.fillStyle = `rgba(255, 51, 102, ${Math.max(0.15, currentMemory)})`; // Neon Pink
            ctx.fillText(asciiChars[staticNoiseIdx], c * cellW, r * cellH);
          } 
          else if (trailAlpha > 15) {
            const charIdx = Math.floor((trailAlpha / 255) * (asciiChars.length - 1) + noiseVal * 2);
            const safeIdx = Math.max(0, Math.min(asciiChars.length - 1, charIdx));

            ctx.fillStyle = "#1818E8"; // Brand theme blue trail
            ctx.fillText(asciiChars[safeIdx], c * cellW, r * cellH);
          }
          else if (isInsideSmiley && (c + r) % 6 === 0) {
            const lowNoiseIdx = Math.abs(Math.floor(noiseVal * 2)) % (asciiChars.length - 1);
            ctx.fillStyle = "rgba(24, 24, 232, 0.04)"; // Sparse background watermark hint
            ctx.fillText(asciiChars[lowNoiseIdx], c * cellW, r * cellH);
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1, 
      }}
    />
  );
}
