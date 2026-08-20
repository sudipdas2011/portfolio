import React, { useEffect, useRef } from "react";

export default function CustomCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Track state to switch between free-mouse tracking and locked-bounds framing
    let isHovering = false;

    // 1. Core Mouse Tracking (Runs when not locked onto an element)
    const moveCursor = (e) => {
      if (isHovering) return; // Allow CSS layout rules to handle the bounds instead
      
      const defaultSize = 15; // Default tiny box size
      cursor.style.width = `${defaultSize}px`;
      cursor.style.height = `${defaultSize}px`;
      
      // Center the tracking box accurately over your hidden native pointer
      cursor.style.transform = `translate3d(${e.clientX - defaultSize / 2}px, ${e.clientY - defaultSize / 2}px, 0)`;
    };

    // 2. Smart Boundary Detection
    const handleMouseOver = (e) => {
      // Automatically triggers for links, buttons, headings, or anything marked with data-hover
      const target = e.target.closest("a, button, h1, h2, p, [data-hover='true']");
      if (!target) return;

      isHovering = true;
      
      // Smart feature: Read the live bounding metrics directly from the DOM object
      const bounds = target.getBoundingClientRect();
      const padding = 12; // Extra brutalist padding frame around the object text

      // Morph the custom cursor layout directly into the object's dimensional envelope
      cursor.style.width = `${bounds.width + padding * 2}px`;
      cursor.style.height = `${bounds.height + padding * 2}px`;
      
      // Snap positions perfectly to the screen coordinates of the tracked element
      cursor.style.transform = `translate3d(${bounds.left - padding}px, ${bounds.top - padding}px, 0)`;
    };

    // 3. Reset to Free Mouse Mode
    const handleMouseOut = (e) => {
      const target = e.target.closest("a, button, h1, h2, p, [data-hover='true']");
      if (!target) return;

      isHovering = false;
    };

    window.addEventListener("mousemove", moveCursor, { passive: true });
    window.addEventListener("mouseover", handleMouseOver);
    window.addEventListener("mouseout", handleMouseOut);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
    };
  }, []);

  return (
    <>
      {/* Structural Styles */}
      <style>{`
        /* Deactivates standard system cursors safely across targets */
        body, a, button, h1, h2, p, [data-hover='true'] {
          cursor: none !important;
        }

        .brutalist-smart-mask {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 999999;
          
          /* Hard solid background mask for brutalist text clipping */
          background-color: #ffffff;
          mix-blend-mode: difference;
          
          /* Dead-sharp corners matching industrial schemas */
          border-radius: 0px; 
          
          /* Will-change optimization tells the GPU to handle layout updates cleanly */
          will-change: transform, width, height;
          
          /* Smooth, elastic layout transformation for sizing changes */
          transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                      width 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                      height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Dynamic DOM target container */}
      <div ref={cursorRef} className="brutalist-smart-mask" />
    </>
  );
}
