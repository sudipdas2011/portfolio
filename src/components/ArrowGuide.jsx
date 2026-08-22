import React, { useEffect, useState, useRef } from "react";

export default function ArrowGuide({ 
  range = "bottom",                     // "top", "bottom", "left", "right"
  lookAt = { x: "center", y: "bottom" }, // target focus point
  smoothFactor = 0.12,                   // lower = smoother/draggier layout movement
  onInRange
}) {
  const [isActive, setIsActive] = useState(false);
  
  const mouse = useRef({ x: 0, y: 0, vx: 0, vy: 0, lastX: 0, lastY: 0 });
  const arrow = useRef({ x: 0, y: 0, angle: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    let animationFrameId;

    const runPhysicsLoop = () => {
      const mx = mouse.current.x;
      const my = mouse.current.y;
      const sw = window.innerWidth;
      const sh = window.innerHeight;

      // 1. Calculate active pointer speed vectors
      mouse.current.vx = mx - mouse.current.lastX;
      mouse.current.vy = my - mouse.current.lastY;
      mouse.current.lastX = mx;
      mouse.current.lastY = my;

      const speed = Math.sqrt(mouse.current.vx * mouse.current.vx + mouse.current.vy * mouse.current.vy);

      // 2. Evaluate active visibility boundaries
      let insideRange = false;
      if (range === "bottom" && my > sh * 0.75) insideRange = true;
      if (range === "top" && my < sh * 0.25) insideRange = true;
      if (range === "left" && mx < sw * 0.25) insideRange = true;
      if (range === "right" && mx > sw * 0.75) insideRange = true;

      setIsActive(insideRange);

      // FIXED TRANSITION SNAP: Uses clip-path to mask out the visibility instead of breaking structural layout width/height properties
      const root = document.documentElement;
      if (insideRange) {
        root.style.setProperty("--mask-clip-override", "polygon(0 0, 0 0, 0 0, 0 0)");
        root.style.setProperty("--mask-opacity", "0");
      } else {
        root.style.removeProperty("--mask-clip-override");
        root.style.setProperty("--mask-opacity", "1");
      }

      if (containerRef.current) {
        if (insideRange) {

          //Fires a callback on evry frame if cursor in rannge
          if (onInRange) onInRange({ x: mx, y: my, speed: speed });

          // 3. Resolve target focus lookAt coordinates
          let targetX = sw / 2;
          let targetY = sh;

          if (typeof lookAt.x === "number") targetX = lookAt.x;
          else if (lookAt.x === "center") targetX = sw / 2;

          if (typeof lookAt.y === "number") targetY = lookAt.y;
          else if (lookAt.y === "bottom") targetY = sh;
          else if (lookAt.y === "top") targetY = 0;

          // 4. Compute layout directional angles
          const angleToTarget = Math.atan2(targetY - my, targetX - mx);
          const angleToVelocity = speed > 1.5 ? Math.atan2(mouse.current.vy, mouse.current.vx) : angleToTarget;

          const velocityWeight = Math.min(speed / 25, 0.85); 
          
          let diff = angleToVelocity - angleToTarget;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          
          const idealAngleRad = angleToTarget + diff * velocityWeight;
          let idealAngleDeg = idealAngleRad * (180 / Math.PI);

          // 5. Apply fluid spring easing interpolation vectors
          arrow.current.x += (mx - arrow.current.x) * smoothFactor;
          arrow.current.y += (my - arrow.current.y) * smoothFactor;

          let angleDiff = idealAngleDeg - arrow.current.angle;
          while (angleDiff < -180) angleDiff += 360;
          while (angleDiff > 180) angleDiff -= 360;
          arrow.current.angle += angleDiff * smoothFactor;

          // Execute rendering transformations on the viewport
          containerRef.current.style.transform = `translate3d(${arrow.current.x}px, ${arrow.current.y}px, 0) rotate(${arrow.current.angle}deg) scale(1)`;
          containerRef.current.style.opacity = "1";
        } else {
          // If you exit the active boundary range, ease position down and scale out smoothly
          arrow.current.x += (mx - arrow.current.x) * smoothFactor;
          arrow.current.y += (my - arrow.current.y) * smoothFactor;
          
          containerRef.current.style.transform = `translate3d(${arrow.current.x}px, ${arrow.current.y}px, 0) rotate(${arrow.current.angle}deg) scale(0)`;
          containerRef.current.style.opacity = "0";
        }
      }

      animationFrameId = requestAnimationFrame(runPhysicsLoop);
    };

    const trackMouse = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", trackMouse, { passive: true });
    animationFrameId = requestAnimationFrame(runPhysicsLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", trackMouse);
      root.style.removeProperty("--mask-clip-override");
      document.documentElement.style.setProperty("--mask-opacity", "1");
    };
  }, [range, lookAt, smoothFactor]);

  return (
    <>
      <style>{`
        /* FIXED: Controls visibility rendering using hardware clip-paths without destroying layout width and height tracking */
        .brutalist-smart-mask {
          opacity: var(--mask-opacity, 1) !important;
          clip-path: var(--mask-clip-override, polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)) !important;
          transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      clip-path 0.25s cubic-bezier(0.16, 1, 0.3, 1),
                      width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
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

      <div 
        ref={containerRef}
        className="brutalist-fluid-arrow"
      >
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
