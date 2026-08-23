import React, { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import Magnetic from './Magnetic';
import { CursorEnlarge } from './Cursor';

export default function Orbit({
  children,
  targetId,
  radius = 200,
  rpm = 3,
  ease = 'linear',
}) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const rotation = useMotionValue(0);
  const counter = useTransform(rotation, (value) => -value);

  const items = React.Children.toArray(children);
  const duration = rpm > 0 ? 60 / rpm : 20;

  useEffect(() => {
    if (!targetId) return;

    const target = document.getElementById(targetId);
    const parent = target?.parentElement;

    if (!target || !parent) return;

    const rect = target.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    setOffset({
      x: rect.left + rect.width / 2 - (parentRect.left + parentRect.width / 2),
      y: rect.top + rect.height / 2 - (parentRect.top + parentRect.height / 2),
    });
  }, [targetId]);

  useEffect(() => {
    if (!items.length) return;

    const anim = animate(rotation, rotation.get() + 360, {
      duration,
      ease,
    });

    anim.then(() => {
      if (anim.currentTime !== null) {
        animate(rotation, rotation.get() + 360, {
          duration,
          ease,
        });
      }
    });

    return () => anim.stop();
  }, [duration, ease, rotation, items.length]);

  if (!items.length) return null;

  const width = Math.min(window.innerWidth, window.innerHeight) * 0.14;

  return (
    <div
      className="orbit"
      style={{
        position: 'absolute',
        left: `calc(50% + ${offset.x}px)`,
        top: `calc(50% + ${offset.y}px)`,
        zIndex: 1,
      }}
    >
      <motion.div
        style={{
          rotate: rotation,
          position: 'relative',
          width: 0,
          height: 0,
        }}
      >
        {items.map((item, i) => {
          const angle = (i / items.length) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <div
              key={i}
              className="orbit-item"
              style={{
                position: 'absolute',
                left: x,
                top: y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Magnetic>
                <motion.div
                  className="orbit-card"
                  style={{
                    rotate: counter,
                    width,
                  }}
                >
                  <CursorEnlarge
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    >
                      {item}
                    </div>
                  </CursorEnlarge>
                </motion.div>
              </Magnetic>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}