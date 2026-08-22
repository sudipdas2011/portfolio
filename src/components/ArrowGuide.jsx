import React, { useEffect, useState, useRef } from "react";

export default function ArrowGuide({ 
  range = "bottom",    // screen sectors: "top", "bottom", "left", "right"
  lookAt = { x: "center", y: "bottom" } // focal targets: "center", "top", "bottom" or raw pixel coordinates
}) {
  const [isActive, setIsActive] = useState(false);
  const [arrowStyle, setArrowStyle] = useState({ transform: "translate3d(-100px, -100px, 0) rotate(0deg)", opacity: 0 });
  const mouseCoords = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 1. high-performance render frame loop tracker
    let animationFrameId;

    const runGuideCalculation = () => {
      const mx = mouseCoords.current.x;
      const my = mouseCoords.current.y;
      const sw = window.innerWidth;
      const sh = window.innerHeight;

      // 2. automated trigger range evaluation matrix
      let insideRange = false;
      if (range === "bottom" && my > sh * 0.75) insideRange = true;
      if (range === "top" && my < sh * 0.25) insideRange = true;
      if (range === "left" && mx < sw * 0.25) insideRange = true;
      if (range === "right" && mx > sw * 0.75) insideRange = true;

      setIsActive(insideRange);

      // notify your master custom cursor element to hide its shape when active
      const root = document.documentElement;
      if (insideRange) {
        root.style.setProperty("--mask-opacity", "0"); // hides your default 15px box shape smoothly
      } else {
        root.style.setProperty("--mask-opacity", "1");
      }

      if (insideRange) {
        // 3. focal destination screen coordinates resolver
        let targetX = sw / 2;
        let targetY = sh; // default bottom center fallback

        if (typeof lookAt.x === "number") targetX = lookAt.x;
        else if (lookAt.x === "center") targetX = sw / 2;

        if (typeof lookAt.y === "number") targetY = lookAt.y;
        else if (lookAt.y === "bottom") targetY = sh;
        else if (lookAt.y === "top") targetY = 0;

        // 4. brutalist trigonometry lookat calculation vector
        const radians = Math.atan2(targetY - my, targetX - mx);
        const degrees = radians * (180 / Math.PI);

        setArrowStyle({
          transform: `translate3d(${mx}px, ${my}px, 0) rotate(${degrees}deg)`,
          opacity: 1
        });
      } else {
        setArrowStyle(prev => ({ ...prev, opacity: 0 }));
      }

      animationFrameId = requestAnimationFrame(runGuideCalculation);
    };

    const captureCoords = (e) => {
      mouseCoords.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener("mousemove", captureCoords, { passive: true });
    animationFrameId = requestAnimationFrame(runGuideCalculation);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", captureCoords);
      document.documentElement.style.setProperty("--mask-opacity", "1");
    };
  }, [range, lookAt]);

  return (
    <>
      <style>{`
        /* dynamically tells your custom cursor mask div to fade when arrow is active */
        .brutalist-smart-mask {
          opacity: var(--mask-opacity, 1) !important;
          transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), 
                      width 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
                      height 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        /* 5. structural layout configuration for the takeover svg arrow pointer */
        .brutalist-arrow-pointer {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 9999999;
          width: 32px;
          height: 32px;
          
          /* anchors center of rotation straight onto your real hidden mouse coordinate tip */
          margin-left: -16px;
          margin-top: -16px;
          
          mix-blend-mode: difference; /* matches your exact core invert coloring style */
          will-change: transform, opacity;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      <div 
        className="brutalist-arrow-pointer" 
        style={arrowStyle}
      >
        {/* clean industrial raw geometric guide svg arrow geometry */}
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
