import React, { useEffect, useRef } from 'react';

export default function Arrow({
  range = 'bottom',
  lookAt = { x: 'center', y: 'bottom' },
  smooth = 0.12,
  trail = false,
  sections = [],
  onChange,
  onMove,
}) {
  const mouse = useRef({
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
  });

  const arrow = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    angle: 0,
  });

  const points = useRef([]);
  const arrowRef = useRef(null);
  const canvasRef = useRef(null);
  const activeRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    let frame;

    const resize = () => {
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const move = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      if (trail && e.clientY > window.innerHeight * 0.75) {
        points.current.push({
          x: arrow.current.x,
          y: arrow.current.y,
        });

        if (points.current.length > 12) {
          points.current.shift();
        }
      }
    };

    const update = () => {
      const { x, y, lastX, lastY } = mouse.current;
      const width = window.innerWidth;
      const height = window.innerHeight;

      const vx = x - lastX;
      const vy = y - lastY;
      const speed = Math.hypot(vx, vy);

      mouse.current.lastX = x;
      mouse.current.lastY = y;

      let allowed = true;

      if (sections.length) {
        const target = document.elementFromPoint(x, y);

        allowed = target
          ? sections.some((selector) => target.closest(selector))
          : false;
      }

      let active = false;

      if (allowed) {
        if (range === 'bottom') active = y > height * 0.75;
        if (range === 'top') active = y < height * 0.25;
        if (range === 'left') active = x < width * 0.25;
        if (range === 'right') active = x > width * 0.75;
      }

      if (active !== activeRef.current) {
        activeRef.current = active;
        onChange?.(active);
      }

      const root = document.documentElement;

      if (active) {
        root.style.setProperty(
          '--mask-clip-override',
          'polygon(0 0, 0 0, 0 0, 0 0)'
        );
        root.style.setProperty('--mask-opacity', '0');
      } else {
        root.style.removeProperty('--mask-clip-override');
        root.style.setProperty('--mask-opacity', '1');
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (trail && active) {
          points.current.forEach((point, i) => {
            const size = 10 + i * 1.2;

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(
              point.x,
              point.y,
              size,
              0,
              Math.PI * 2
            );
            ctx.fill();
          });
        } else {
          points.current = [];
        }
      }

      const el = arrowRef.current;

      if (el) {
        if (active) {
          onMove?.({
            x,
            y,
            speed,
          });

          let targetX = width / 2;
          let targetY = height;

          if (typeof lookAt.x === 'number') {
            targetX = lookAt.x;
          } else if (lookAt.x === 'left') {
            targetX = 0;
          } else if (lookAt.x === 'right') {
            targetX = width;
          }

          if (typeof lookAt.y === 'number') {
            targetY = lookAt.y;
          } else if (lookAt.y === 'top') {
            targetY = 0;
          } else if (lookAt.y === 'bottom') {
            targetY = height;
          }

          const targetAngle = Math.atan2(
            targetY - y,
            targetX - x
          );

          const moveAngle =
            speed > 1.5
              ? Math.atan2(vy, vx)
              : targetAngle;

          let angle = targetAngle;

          if (speed > 1.5) {
            angle =
              targetAngle * 0.7 +
              moveAngle * 0.3;
          }

          const degrees = angle * (180 / Math.PI);

          let diff = degrees - arrow.current.angle;

          if (diff > 180) diff -= 360;
          if (diff < -180) diff += 360;

          arrow.current.x +=
            (x - arrow.current.x) * smooth;

          arrow.current.y +=
            (y - arrow.current.y) * smooth;

          arrow.current.angle += diff * smooth;

          el.style.transform =
            `translate3d(${arrow.current.x}px, ${arrow.current.y}px, 0) ` +
            `rotate(${arrow.current.angle}deg)`;

          el.style.opacity = '1';
        } else {
          arrow.current.x = x;
          arrow.current.y = y;

          el.style.transform =
            `translate3d(${x}px, ${y}px, 0) ` +
            `rotate(${arrow.current.angle}deg) ` +
            `scale(0)`;

          el.style.opacity = '0';
        }
      }

      frame = requestAnimationFrame(update);
    };

    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', move);

    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', move);

      document.documentElement.style.removeProperty(
        '--mask-clip-override'
      );

      document.documentElement.style.setProperty(
        '--mask-opacity',
        '1'
      );
    };
  }, [
    range,
    lookAt,
    smooth,
    trail,
    sections,
    onChange,
    onMove,
  ]);

  return (
    <>
      <svg
        className="arrow-svg"
        aria-hidden="true"
      >
        <defs>
          <filter id="arrow-goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="11"
              result="blur"
            />

            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -11"
            />
          </filter>
        </defs>
      </svg>

      <div className="trail">
        <canvas ref={canvasRef} />
      </div>

      <div
        ref={arrowRef}
        className="arrow"
      >
        <svg
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <line
            x1="2"
            y1="12"
            x2="22"
            y2="12"
          />

          <polyline points="14 4 22 12 14 20" />
        </svg>
      </div>
    </>
  );
}