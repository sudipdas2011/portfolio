import React, { useEffect, useRef, useState } from 'react';
import { createCarousel } from '../gl/scene';
import { createScrollController } from '../gl/scroll';
import { config } from '../gl/config';

const Carousel = () => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const scrollEngineRef = useRef(null);
  const cleanupFunctionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    console.log("=== [CAROUSEL ENGINE] Initializing with Configuration Pointers ===");
    
    let animationFrameId;
    let timer1;
    let timer2;
    let isDestroyed = false;

    const initializeEngine = () => {
      if (isDestroyed) return;
      
      if (!containerRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(initializeEngine);
        return;
      }

      try {
        // 1. Initialize Scroll Controller with BOTH container and config parameters
        if (typeof createScrollController === 'function') {
          scrollEngineRef.current = createScrollController(containerRef.current, config);
          console.log("✅ Scroll Controller initialized smoothly:", scrollEngineRef.current);
        }

        const rawCanvas = canvasRef.current;
        const rawContainer = containerRef.current;

        // 2. Build a Universal Proxy Object to safely route any layout properties
        const universalTarget = new Proxy({}, {
          get: (target, prop) => {
            if (prop === 'canvas') return rawCanvas;
            if (prop === 'container') return rawContainer;
            if (prop === 'config') return config;
            if (prop === 'scroll') return scrollEngineRef.current;
            if (prop === 'onActiveChange') {
              return (idx) => console.log(`🎯 Helix index transition -> ${idx}`);
            }

            if (typeof rawCanvas[prop] === 'function') {
              return (...args) => rawCanvas[prop](...args);
            }
            
            return rawCanvas[prop] !== undefined ? rawCanvas[prop] : rawContainer[prop];
          }
        });

        // 3. Instantiate the WebGL Carousel via proxy mappings
        if (typeof createCarousel === 'function') {
          cleanupFunctionRef.current = createCarousel(universalTarget, universalTarget);
          console.log("✅ WebGL Carousel Context mounted onto scene layers.");
        }
      } catch (err) {
        console.error("💥 Boot processing loop failed:", err);
      }

      // 4. Position tracking frame update tick loop
      const syncLoop = () => {
        if (isDestroyed) return;
        if (scrollEngineRef.current) {
          setScrollProgress(scrollEngineRef.current.progress || 0);
        }
        animationFrameId = requestAnimationFrame(syncLoop);
      };
      animationFrameId = requestAnimationFrame(syncLoop);

      // Force dimension scaling updates once on load to clear visual sizing locks
      window.dispatchEvent(new Event('resize'));
    };

    animationFrameId = requestAnimationFrame(initializeEngine);

    // 5. Safe resize handler: Triggers window update without looping
    const handleResize = () => {
      console.log("📐 Viewport resize detected. Updating layout bounds...");
    };
    window.addEventListener('resize', handleResize);

    // 6. Component Cleanup Logic
    return () => {
      console.log("=== [CAROUSEL ENGINE] Performing Garbage Collection ===");
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timer1);
      clearTimeout(timer2);
      window.removeEventListener('resize', handleResize);
      
      if (typeof cleanupFunctionRef.current === 'function') {
        cleanupFunctionRef.current();
      }
      
      if (scrollEngineRef.current && typeof scrollEngineRef.current.destroy === 'function') {
        scrollEngineRef.current.destroy();
      } else if (scrollEngineRef.current && typeof scrollEngineRef.current.dispose === 'function') {
        scrollEngineRef.current.dispose();
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
        zIndex: 30
      }}
    >
      {/* WebGL Canvas Component Target */}
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
          zIndex: 31 
        }} 
      />
      
      {/* Floating Meta Project Details Labels Overlay Layer */}
      <div 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          pointerEvents: 'none', 
          zIndex: 32, 
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
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px' }}>
                {project.title}
              </h2>
              <p style={{ fontSize: '1rem', color: '#cccccc', marginTop: '8px', letterSpacing: '2px' }}>
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
