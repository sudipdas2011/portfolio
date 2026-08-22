import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls, useMotionValue, useTransform } from 'framer-motion';
import MagneticPull from './MagneticPull';
import { CursorEnlarge } from './CustomCursor'; // Strictly imported the wrapper tag block

export default function RevolvingStage({ 
  children, 
  targetId, 
  radius = 200,
  size = 10, 
  rpm = 3,          
  easeType = "linear" 
}) {
  const [isRotating, setIsRotating] = useState(true);
  const [centerOffset, setCenterOffset] = useState({ x: 0, y: 0 });
  const [lapCount, setLapCount] = useState(0);
  
  const controls = useAnimationControls();
  const cardsArray = React.Children.toArray(children);

  // 1. Set up high-precision motion trackers for real-time counter-rotation
  const orbitRotation = useMotionValue(0);
  const inverseRotation = useTransform(orbitRotation, (value) => -value);

  const durationPerLap = rpm > 0 ? 60 / rpm : 20;

  // Track and align center coordinates to the title object
  useEffect(() => {
    if (!targetId) return;
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const parentRect = targetEl.parentElement.getBoundingClientRect();
      setCenterOffset({
        x: (rect.left + rect.width / 2) - (parentRect.left + parentRect.width / 2),
        y: (rect.top + rect.height / 2) - (parentRect.top + parentRect.height / 2)
      });
    }
  }, [targetId]);

  // 2. The Revolution Loop Engine: Drives the continuous cycle
  useEffect(() => {
    let active = true;

    const runOrbitSequence = async () => {
      if (!isRotating || !active) return;

      const nextTargetAngle = (lapCount + 1) * 360;

      await controls.start({
        rotate: nextTargetAngle,
        transition: { 
          duration: durationPerLap, 
          ease: easeType 
        }
      });

      if (active && isRotating) {
        setLapCount(prev => prev + 1);
      }
    };

    runOrbitSequence();

    return () => {
      active = false;
    };
  }, [isRotating, lapCount, durationPerLap, easeType, controls]);

  // Handle manual stopping cleanly mid-rotation
  useEffect(() => {
    if (!isRotating) {
      controls.stop();
    }
  }, [isRotating, controls]);

  if (cardsArray.length === 0) return null;

  return (
    <div className="revolving-stage-container" style={{
      position: 'absolute',
      left: `calc(50% + ${centerOffset.x}px)`,
      top: `calc(50% + ${centerOffset.y}px)`,
      zIndex: 1 
    }}>
      {/* 3. Link orbitRotation motion value directly to the rotating container style parameter */}
      <motion.div 
        animate={controls} 
        style={{ rotate: orbitRotation, position: 'relative', width: '0px', height: '0px' }}
      >
        {cardsArray.map((card, index) => {
          const baseAngle = (index / cardsArray.length) * 2 * Math.PI;
          const x = Math.cos(baseAngle) * radius;
          const y = Math.sin(baseAngle) * radius;

          return (
            <div
              key={index}
              className="revolving-card-wrapper"
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* 4. Apply the inverse motion variable style. */}
              <MagneticPull>
                <motion.div 
                  style={{
                    rotate: inverseRotation,
                    width: `${0.7 * Math.min(window.innerWidth, window.innerHeight) * 0.3}px`
                   }}
                  className="brutalist-43-card"

                >
                  {/* 
                    INTEGRATED ENLARGEMENT WRAPPER SYSTEM:
                    By wrapping the outer grid element context directly here, 
                    the custom cursor reads the exact width/height bounds of each 
                    revolving asset block seamlessly as it travels down its loop path.
                  */}
                  <CursorEnlarge style={{ width: '100%', height: '100%' }}>
                    <div style={{ width: '100%', height: '100%' }}>
                      {card}
                    </div>
                  </CursorEnlarge>
                </motion.div>
              </MagneticPull>
            </div>
          );
        })}
      </motion.div>

    </div>
  );
}
