import React, { useEffect, useState, useRef } from "react";

export default function ArrowGuide({ 
  range = "bottom",                     
  lookAt = { x: "center", y: "bottom" }, 
  smoothFactor = 0.12,                  
  trail = false,
  allowedSections = [], // NEW: Pass selectors list here (e.g., ["#hero", ".hero-section"])
  onRangeChange,                        
  onInRange                             
}) {
  const [insideRange, setInsideRange] = useState(false);
  
  const mouse = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0 });
  const arrow = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2, angle: 0, tick: 0 });
  
  const history = useRef([]);
  const maxHistoryPoints = 12; 
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const lastActiveState = useRef(false);

  useEffect(() => {
    let animationFrameId;
    const canvas = canvasRef.current;
    const ctx = canvas ? canvas.getContext("2d") : null;

    const resizeCanvas = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const runPhysicsLoop = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const sw = window.innerWidth;
      const sh = window.innerHeight;

      arrow.current.tick += 0.4;

      mouse.current.vx = mx - mouse.current.lastX;
      mouse.current.vy = my - mouse.current.lastY;
      mouse.current.lastX = mx;
      mouse.current.lastY = my;

      const speed = Math.sqrt(mouse.current.vx * mouse.current.vx + mouse.current.vy * mouse.current.vy);

      // --- 1. DYNAMIC SECTION ALLOW-LIST MATRIX CHECK ---
      let isInsideAllowedSection = true;

      // If specific sections are specified, proactively evaluate if the cursor resides inside them
      if (allowedSections && allowedSections.length > 0) {
        const elementUnderMouse = document.elementFromPoint(mx, my);
        
        if (elementUnderMouse) {
          // Check if the current element matches or is nested inside any allowed selector string
          const matchingTarget = allowedSections.some(selector => 
            elementUnderMouse.closest(selector) !== null
          );
          isInsideAllowedSection = matchingTarget;
        } else {
          isInsideAllowedSection = false;
        }
      }

      // --- 2. EVALUATE ACTIVATION GATES ---
      let active = false;
      if (isInsideAllowedSection) {
        if (range === "bottom" && my > sh * 0.75) active = true;
        if (range === "top" && my < sh * 0.25) active = true;
        if (range === "left" && mx < sw * 0.25) active = true;
        if (range === "right" && mx > sw * 0.75) active = true;
      }

      setInsideRange(active);

      if (onRangeChange && lastActiveState.current !== active) {
        onRangeChange(active);
        lastActiveState.current = active;
      }

      const root = document.documentElement;
      if (active) {
        root.style.setProperty("--mask-clip-override", "polygon(0 0, 0 0, 0 0, 0 0)");
        root.style.setProperty("--mask-opacity", "0");
      } else {
        root.style.removeProperty("--mask-clip-override");
        root.style.setProperty("--mask-opacity", "1");
      }

      // --- Canvas Trail Draw Logic ---
      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (trail && active) {
          if (!active && history.current.length > 0) {
            history.current.shift();
          }
          for (let i = 0; i < history.current.length; i++) {
            const pt = history.current[i];
            const ratio = i / history.current.length;
            const baseSize = 10 + 16 * ratio; 
            const noiseX = Math.sin(i * 2.5 + arrow.current.tick) * (4 * (1 - ratio));
            const noiseY = Math.cos(i * 2.5 + arrow.current.tick) * (4 * (1 - ratio));
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pt.x + noiseX, pt.y + noiseY, baseSize, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          history.current = [];
        }
      }

      // --- Arrow Position Rendering ---
      if (containerRef.current) {
        if (active) {
          if (onInRange) onInRange({ x: mx, y: my, speed: speed });

          let targetX = sw / 2;
          let targetY = sh;
          if (typeof lookAt.x === "number") targetX = lookAt.x;
          else if (lookAt.x === "center") targetX = sw / 2;
          if (typeof lookAt.y === "number") targetY = lookAt.y;
          else if (lookAt.y === "bottom") targetY = sh;
          if (lookAt.y === "top") targetY = 0;

          const angleToTarget = Math.atan2(targetY - my, targetX - mx);
          const angleToVelocity = speed > 1.5 ? Math.atan2(mouse.current.vy, mouse.current.vx) : angleToTarget;
          const velocityWeight = Math.min(speed / 25, 0.85); 
          
          let diff = angleToVelocity - angleToTarget;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          
          const idealAngleRad = angleToTarget + diff * velocityWeight;
          let idealAngleDeg = idealAngleRad * (180 / Math.PI);

          arrow.current.x += (mx - arrow.current.x) * smoothFactor;
          arrow.current.y += (my - arrow.current.y) * smoothFactor;

          let angleDiff = idealAngleDeg - arrow.current.angle;
          while (angleDiff < -180) angleDiff += 360;
          while (angleDiff > 180) angleDiff -= 360;
          arrow.current.angle += angleDiff * smoothFactor;

          containerRef.current.style.transform = `translate3d(${arrow.current.x}px, ${arrow.current.y}px, 0) rotate(${arrow.current.angle}deg) scale(1)`;
          containerRef.current.style.opacity = "1";
        } else {
          arrow.current.x = mx;
          arrow.current.y = my;
          containerRef.current.style.transform = `translate3d(${mx}px, ${my}px, 0) rotate(${arrow.current.angle}deg) scale(0)`;
          containerRef.current.style.opacity = "0";
        }
      }

      animationFrameId = requestAnimationFrame(runPhysicsLoop);
    };

    const trackMouse = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (trail && mouse.current.y > window.innerHeight * 0.75) { 
        history.current.push({ x: arrow.current.x, y: arrow.current.y });
        if (history.current.length > maxHistoryPoints) history.current.shift();
      }
    };

    window.addEventListener("mousemove", trackMouse, { passive: true });
    animationFrameId = requestAnimationFrame(runPhysicsLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", trackMouse);
      window.removeEventListener("resize", resizeCanvas);
      document.documentElement.style.removeProperty("--mask-clip-override");
      document.documentElement.style.setProperty("--mask-opacity", "1");
    };
  }, [range, lookAt, smoothFactor, trail, allowedSections, onRangeChange, onInRange]);

  return (
    <>
      <style>{`
        .brutalist-smart-mask {
          opacity: var(--mask-opacity, 1) !important;
          clip-path: var(--mask-clip-override, polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)) !important;
          transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      clip-path 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        .brutalist-trail-matrix-layer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          z-index: 9999998; 
          mix-blend-mode: difference;
          filter: url(#brutalist-gooey-noise-matrix);
          background-color: transparent;
          display: ${trail ? "block" : "none"};
        }

        .brutalist-fluid-arrow {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9999999;
          width: 34px;
          height: 34px;
          margin-left: -17px;
          margin-top: -17px;
          mix-blend-mode: difference;
          opacity: 0;
          will-change: transform, opacity;
          transition: opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <svg style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}>
        <defs>
          <filter id="brutalist-gooey-noise-matrix">
            <feGaussianBlur in="SourceGraphic" stdDeviation="11" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -11" />
          </filter>
        </defs>
      </svg>

      <div className="brutalist-trail-matrix-layer">
        <canvas ref={canvasRef} style={{ display: "block" }} />
      </div>

      <div ref={containerRef} className="brutalist-fluid-arrow">
        <svg 
          viewBox="0 0 24 24" 
          width="100%" 
          height="100%" 
          fill="none" 
          stroke="#ffffff" 
          strokeWidth="2.5" 
          strokeLinecap="square" 
          strokeLinejoin="miter"
        >
          <line x1="2" y1="12" x2="22" y2="12" />
          <polyline points="14 4 22 12 14 20" />
        </svg>
      </div>
    </>
  );
}
