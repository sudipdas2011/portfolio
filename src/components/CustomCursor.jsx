import React, { useEffect, useRef } from "react";

export function CursorEnlarge({ children, className = "", style = {} }) {
  return (
    <div
      data-hover="true"
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      {children}
    </div>
  );
}

export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let isHovering = false;
    let activeTarget = null;
    let animationFrameId = null;

    // Track real-time raw mouse coordinates
    let mouseX = 0;
    let mouseY = 0;
    const defaultSize = 15;

    const updateMouseCoords = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    // Helper function to safely locate valid brutalist interactive target elements
    const getValidTarget = (element) => {
      if (!element) return null;
      return element.closest("a, button, h1, h2, p, [data-hover='true']");
    };

    const renderLoop = () => {
      if (isHovering && activeTarget) {
        const bounds = activeTarget.getBoundingClientRect();
        
        // Check if the actual mouse coordinates have slipped outside the active card's moving box
        if (
          mouseX < bounds.left ||
          mouseX > bounds.right ||
          mouseY < bounds.top ||
          mouseY > bounds.bottom
        ) {
          // Scan the exact point under the pointer to see if another card has rotated into place
          const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
          const nextTarget = getValidTarget(elementUnderMouse);

          if (nextTarget && nextTarget !== activeTarget) {
            // Instantly transfer lock settings to the newly detected card without unmounting focus
            activeTarget = nextTarget;
          } else {
            // Absolute baseline release if the space beneath the pointer is entirely empty
            isHovering = false;
            activeTarget = null;
          }
        }
      } else if (!isHovering) {
        // If the cursor is free but cards are spinning under a static mouse pointer, catch them instantly
        const elementUnderMouse = document.elementFromPoint(mouseX, mouseY);
        const autoTarget = getValidTarget(elementUnderMouse);
        
        if (autoTarget) {
          isHovering = true;
          activeTarget = autoTarget;
        }
      }

      if (!isHovering || !activeTarget) {
        // STATE A: Free Mouse Tracking (Snaps box back to default pointer coordinates)
        cursor.style.width = `${defaultSize}px`;
        cursor.style.height = `${defaultSize}px`;
        cursor.style.transform = `translate3d(${mouseX - defaultSize / 2}px, ${mouseY - defaultSize / 2}px, 0)`;
      } else {
        // STATE B: Active Proportional Tracking (Locks coordinates onto moving bounds layout)
        const bounds = activeTarget.getBoundingClientRect();
        const padding = 12; // Your exact original padding specification

        cursor.style.width = `${bounds.width + padding * 2}px`;
        cursor.style.height = `${bounds.height + padding * 2}px`;
        cursor.style.transform = `translate3d(${bounds.left - padding}px, ${bounds.top - padding}px, 0)`;
      }

      // Re-queue the engine frame tick
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    // Kick off the loop thread
    animationFrameId = requestAnimationFrame(renderLoop);

    const handleMouseOver = (e) => {
      const target = getValidTarget(e.target);
      if (!target) return;

      isHovering = true;
      activeTarget = target;
    };

    const handleMouseOut = (e) => {
      const target = getValidTarget(e.target);
      if (!target) return;

      // The loop's point scanner handles chaining, but this catches swift clean exits safely
      isHovering = false;
      activeTarget = null;
    };

    // Attach passive listeners safely
    window.addEventListener("mousemove", updateMouseCoords, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", updateMouseCoords);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <>
      <style>{`
        /* Deactivates raw OS mouse pointer rendering contexts safely over active targets */
        body, a, button, h1, h2, p, [data-hover='true'] {
          cursor: none !important;
        }

        .brutalist-smart-mask {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 999999;

          //for ARROW GUIDING...
          opacity: var(--mask-opacity, 1) !important; 
          
          /* Your exact styling parameters and mix-blend profiles preserved fully */
          background-color: #ffffff;
          mix-blend-mode: difference;
          border-radius: 0px; 
          
          will-change: transform, width, height;
          
          /* 
            Optimized elastic tracking speed config: Ensures the cursor morphs 
            cleanly when jumping between overlapping spinning cards.
          */
          transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1),
                      width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Renders the single unified high-contrast tracking box context */}
      <div ref={cursorRef} className="brutalist-smart-mask" />
    </>
  );
}
