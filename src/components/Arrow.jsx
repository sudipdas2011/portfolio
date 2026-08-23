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
  const cursor = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0,
  });

  const arrow = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    angle: 0,
    tick: 0,
  });

  const points = useRef([]);
  const arrowRef = useRef(null);
  const canvasRef = useRef(null);
  const lastActive = useRef(false);

  useEffect(() => {
    let frame;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    const resize = () => {
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const update = () => {
      const mx = cursor.current.x;
      const my = cursor.current.y;
      const width = window.innerWidth;
      const height = window.innerHeight;

      arrow.current.tick += 0.4;

      cursor.current.vx = mx - cursor.current.lastX;
      cursor.current.vy = my - cursor.current.lastY;
      cursor.current.lastX = mx;
      cursor.current.lastY = my;

      const speed = Math.hypot(
        cursor.current.vx,
        cursor.current.vy
      );

      let allowed = true;

      if (sections.length) {
        const target = document.elementFromPoint(mx, my);
        allowed = target
          ? sections.some((selector) => target.closest(selector))
          : false;
      }

      let active = false;

      if (allowed) {
        if (range === 'bottom') active = my > height * 0.75;
        if (range === 'top') active = my < height * 0.25;
        if (range === 'left') active = mx < width * 0.25;
        if (range === 'right') active = mx > width * 0.75;
      }

      if (onChange && active !== lastActive.current) {
        onChange(active);
        lastActive.current = active;
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
          for (let i = 0; i < points.current.length; i++) {
            const point = points.current[i];
            const ratio = i / points.current.length;
            const size = 10 + 16 * ratio;

            const noiseX =
              Math.sin(i * 2.5 + arrow.current.tick) * 4 * (1 - ratio);

            const noiseY =
              Math.cos(i * 2.5 + arrow.current.tick) * 4 * (1 - ratio);

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(
              point.x + noiseX,
              point.y + noiseY,
              size,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        } else {
          points.current = [];
        }
      }

      const el = arrowRef.current;

      if (el) {
        if (active) {
          onMove?.({
            x: mx,
            y: my,
            speed,
          });

          let targetX = width / 2;
          let targetY = height;

          if (typeof lookAt.x === 'number') targetX = lookAt.x;
          if (lookAt.x === 'center') targetX = width / 2;

          if (typeof lookAt.y === 'number') targetY = lookAt.y;
          if (lookAt.y === 'bottom') targetY = height;
          if (lookAt.y === 'top') targetY = 0;

          const targetAngle = Math.atan2(
            targetY - my,
            targetX - mx
          );

          const velocityAngle =
            speed > 1.5
              ? Math.atan2(cursor.current.vy, cursor.current.vx)
              : targetAngle;

          const weight = Math.min(speed / 25, 0.85);

          let diff = velocityAngle - targetAngle;

          if (diff < -Math.PI) diff += Math.PI * 2;
          if (diff > Math.PI) diff -= Math.PI * 2;

          const angle =
            targetAngle + diff * weight;

          let degrees = angle * (180 / Math.PI);
          let angleDiff = degrees - arrow.current.angle;

          if (angleDiff < -180) angleDiff += 360;
          if (angleDiff > 180) angleDiff -= 360;

          arrow.current.x += (mx - arrow.current.x) * smooth;
          arrow.current.y += (my - arrow.current.y) * smooth;
          arrow.current.angle += angleDiff * smooth;

          el.style.transform =
            `translate3d(${arrow.current.x}px, ${arrow.current.y}px, 0) ` +
            `rotate(${arrow.current.angle}deg) scale(1)`;

          el.style.opacity = '1';
        } else {
          arrow.current.x = mx;
          arrow.current.y = my;

          el.style.transform =
            `translate3d(${mx}px, ${my}px, 0) ` +
            `rotate(${arrow.current.angle}deg) scale(0)`;

          el.style.opacity = '0';
        }
      }

      frame = requestAnimationFrame(update);
    };

    const move = (event) => {
      cursor.current.x = event.clientX;
      cursor.current.y = event.clientY;

      if (trail && cursor.current.y > window.innerHeight * 0.75) {
        points.current.push({
          x: arrow.current.x,
          y: arrow.current.y,
        });

        if (points.current.length > 12) {
          points.current.shift();
        }
      }
    };

    resize();

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', move, {
      passive: true,
    });

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

      <div ref={arrowRef} className="arrow">
        <svg
          viewBox="0 0 24 24"
          width="100%"
          height="100%"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <line x1="2" y1="12" x2="22" y2="12" />
          <polyline points="14 4 22 12 14 20" />
        </svg>
      </div>
    </>
  );
}