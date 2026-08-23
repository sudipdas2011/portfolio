import { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';

export default function Magnetic({ children }) {
  const ref = useRef(null);
  const strength = 0.35;

  const spring = {
    damping: 10,
    stiffness: 60,
    mass: 0.6,
  };

  const x = useSpring(0, spring);
  const y = useSpring(0, spring);

  const move = (e) => {
    const { clientX, clientY } = e;
    const rect = ref.current?.getBoundingClientRect();

    if (!rect) return;

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    x.set((clientX - cx) * strength);
    y.set((clientY - cy) * strength);
  };

  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={move}
      onMouseLeave={leave}
      style={{
        x,
        y,
        display: 'inline-block',
      }}
    >
      {children}
    </motion.div>
  );
}