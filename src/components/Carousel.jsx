import React, { useEffect, useRef, useState } from 'react';
import { createCarousel } from '../gl/scene';
import { createScrollController } from '../gl/scroll';
import { config } from '../gl/config';

const Carousel = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollEngineRef = useRef(null);
  const carouselInstanceRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    console.log("=== [CAROUSEL ENGINE TRACE] Mount Triggered ===");
    
    let animationFrameId;
    let timer1;
    let timer2;
    let isDestroyed = false;

    // We use a small execution delay loop to ensure React has fully committed 
    // both elements to the browser's actual DOM frame layout
    const initializeEngine = () => {
      if (isDestroyed) return;
      
      if (!containerRef.current || !canvasRef.current) {
        console.warn("⚠️ Elements still mounting, retrying next frame...");
        animationFrameId = requestAnimationFrame(initializeEngine);
        return;
      }

      console.log("🚀 DOM Nodes fully verified:", {
        container: containerRef.current,
        canvas: canvasRef.current
      });

      try {
        // 1. Boot up Scroll Controller (Passes raw container DOM element directly)
        if (typeof createScrollController === 'function') {
          scrollEngineRef.current = createScrollController(containerRef.current);
          console.log("✅ Scroll Controller Instance created successfully:", scrollEngineRef.current);
        }

        // 2. Boot up WebGL Carousel passing distinct positional arguments
        if (typeof createCarousel === 'function') {
          const optionsBundle = {
            canvas: canvasRef.current, // Guaranteed to be the raw HTMLCanvasElement now
            config: config,
            scroll: scrollEngineRef.current,
            onActiveChange: (index) => {
              console.log(`🎯 Active item transition detected -> Index: ${index}`);
            }
          };

          console.log("⚙️ Executing createCarousel(container, options)...");
          console.log("Arg1:", containerRef.current);
          console.log("Arg2 Options Bundle:", optionsBundle);

          // Fires the initialization function using the signature layout
          carouselInstanceRef.current = createCarousel(containerRef.current, optionsBundle);
          console.log("✅ WebGL Carousel Instance created successfully:", carouselInstanceRef.current);
        }
      } catch (err) {
        console.error("💥 Critical execution crash caught inside boot pipeline:", err);
      }

      // 3. Keep drawing framework transformation synchronization loops
      const syncLoop = () => {
        if (isDestroyed) return;
        if (scrollEngineRef.current) {
          setScrollProgress(scrollEngineRef.current.progress || 0);
        }
        animationFrameId = requestAnimationFrame(syncLoop);
      };
      animationFrameId = requestAnimationFrame(syncLoop);

      // 4. Force Dimension viewport update triggers to fix black canvas screen bugs
      const forceResize = () => {
        if (carouselInstanceRef.current && typeof carouselInstanceRef.current.resize === 'function') {
          carouselInstanceRef.current.resize();
        }
        window.dispatchEvent(new Event('resize'));
      };

      timer1 = setTimeout(forceResize, 150);
      timer2 = setTimeout(forceResize, 600);
    };

    // Kick off the mounting lifecycle initialization check
    animationFrameId = requestAnimationFrame(initializeEngine);

    const handleResize = () => {
      if (carouselInstanceRef.current && typeof carouselInstanceRef.current.resize === 'function') {
        carouselInstanceRef.current.resize();
      }
    };
    window.addEventListener('resize', handleResize);

    // 5. Explicit structural cleanup hooks lifecycle loop
    return () => {
      console.log("=== [CAROUSEL ENGINE TRACE] Unmounting Component ===");
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      
      if (carouselInstanceRef.current) {
        if (typeof carouselInstanceRef.current.destroy === 'function') {
          carouselInstanceRef.current.destroy();
        } else if (carouselInstanceRef.current.renderer) {
          carouselInstanceRef.current.renderer.dispose();
        }
      }
      
      if (scrollEngineRef.current && typeof scrollEngineRef.current.destroy === 'function') {
        scrollEngineRef.current.destroy();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      id="carousel-container"
      className="carousel-section-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#000000',
        userSelect: 'none',
        zIndex: 20
      }}
    >
      {/* Target Canvas Core Element rendering the WebGL pipeline */}
      <canvas 
        ref={canvasRef} 
        id="canvas" 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'block', 
          zIndex: 21 
        }} 
      />
      
      {/* HTML Floating Overlay Labels */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          zIndex: 22, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          fontFamily: 'monospace' 
        }}
      >
        {config.PROJECTS?.map((project, index) => {
          const offset = index - scrollProgress;
          const visible = Math.abs(offset) < 1.5;
          return (
            <div 
              key={project.id || index} 
              style={{ 
                position: 'absolute', 
                transform: `translateY(${offset * 120}px)`, 
                opacity: Math.max(0, 1 - Math.abs(offset) * 1.5), 
                display: visible ? 'block' : 'none', 
                textAlign: 'center', 
                color: '#ffffff' 
              }}
            >
              <h2 style={{ fontSize: '2.2rem', margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px' }}>
                {project.title}
              </h2>
              <p style={{ fontSize: '1rem', color: '#aaaaaa', marginTop: '8px', letterSpacing: '1px' }}>
                {project.category}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Carousel;
