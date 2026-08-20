import { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function MagneticPull({ children }) {
  const ref = useRef(null);
  const pullIntensity = 0.35;

  // Configure a bouncy spring animation for a smooth physics feel
  const springOptions = { damping: 10, stiffness: 60, mass: 0.6 };
  const x = useSpring(0, springOptions);
  const y = useSpring(0, springOptions);

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    
    // Calculate the center point of the element
    const centerX = left + width / 2;
    const centerY = top + height / 2;

    // Distance between mouse pointer and element center
    const distanceX = clientX - centerX;
    const distanceY = clientY - centerY;

    // Pull intensity factor (0.35 means it pulls 35% of the distance toward mouse)
    x.set(distanceX * pullIntensity);
    y.set(distanceY * pullIntensity);
  };

  const handleMouseLeave = () => {
    // Snap cleanly back to center when the mouse leaves
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y, display: 'inline-block' }}
    >
      {children}
    </motion.div>
  );
}
