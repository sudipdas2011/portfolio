import React, { useEffect, useRef } from "react";

export function CursorEnlarge({ children, className = "", style = {} }) {
  return (
    <div
      data-hover="true"
      className={className}
      style={{ display: "inline-block", ...style }}
    >
      {children}
    </div>
  );
}

export default function Cursor() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let active = false;
    let target = null;
    let frame = null;

    let x = 0;
    let y = 0;

    const size = 15;
    const pad = 12;

    const move = (e) => {
      x = e.clientX;
      y = e.clientY;
    };

    const getTarget = (el) => {
      if (!el) return null;

      return el.closest(
        "a, button, h1, h2, p, [data-hover='true']"
      );
    };

    const update = () => {
      if (active && target) {
        const box = target.getBoundingClientRect();

        if (
          x < box.left ||
          x > box.right ||
          y < box.top ||
          y > box.bottom
        ) {
          const next = getTarget(
            document.elementFromPoint(x, y)
          );

          if (next && next !== target) {
            target = next;
          } else {
            active = false;
            target = null;
          }
        }
      } else {
        const next = getTarget(
          document.elementFromPoint(x, y)
        );

        if (next) {
          active = true;
          target = next;
        }
      }

      if (!active || !target) {
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.transform =
          `translate3d(${x - size / 2}px, ${y - size / 2}px, 0)`;
      } else {
        const box = target.getBoundingClientRect();

        el.style.width = `${box.width + pad * 2}px`;
        el.style.height = `${box.height + pad * 2}px`;
        el.style.transform =
          `translate3d(${box.left - pad}px, ${box.top - pad}px, 0)`;
      }

      frame = requestAnimationFrame(update);
    };

    const over = (e) => {
      const next = getTarget(e.target);
      if (!next) return;

      active = true;
      target = next;
    };

    const out = (e) => {
      const next = getTarget(e.target);
      if (!next) return;

      active = false;
      target = null;
    };

    frame = requestAnimationFrame(update);

    window.addEventListener("mousemove", move, {
      passive: true,
    });
    window.addEventListener("mouseover", over);
    window.addEventListener("mouseout", out);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mouseout", out);
    };
  }, []);

  return <div ref={ref} className="cursor" />;
}