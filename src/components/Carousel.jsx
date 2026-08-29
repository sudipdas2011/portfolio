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
    let animationFrameId;
    let isDestroyed = false;

    const initializeEngine = () => {
      if (isDestroyed) return;
      
      if (!canvasRef.current) {
        animationFrameId = requestAnimationFrame(initializeEngine);
        return;
      }

      try {
        cleanupFunctionRef.current = createCarousel(canvasRef.current, {
          onActiveChange: (idx) => {
            console.log(`🎯 Active card: ${idx}`);
            setScrollProgress(idx);
          }
        });
      } catch (err) {
        console.error("Carousel error:", err);
      }
    };

    animationFrameId = requestAnimationFrame(initializeEngine);

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      if (typeof cleanupFunctionRef.current === 'function') {
        cleanupFunctionRef.current();
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
