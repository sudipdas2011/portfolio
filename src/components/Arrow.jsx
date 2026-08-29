import React, { useEffect, useRef } from "react";

export default function Arrow({
  range = "bottom",
  lookAt,
  smooth = 0.12,
  trail = false,
  sections = [],
  onChange,
  onMove,
}) {
  const mouse = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });

  const arrow = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    angle: 0,
  });

  const activeRef = useRef(false);
  const arrowRef = useRef(null);
  const canvasRef = useRef(null);
  const points = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    let frame;
    const resize = () => {
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const move = (event) => {
      mouse.current.x = event.clientX;
      mouse.current.y = event.clientY;
      if (
        trail &&
        event.clientY >
          window.innerHeight * 0.75
      ) {
        points.current.push({
          x: arrow.current.x,
          y: arrow.current.y,
        });

        if (points.current.length > 12) {
          points.current.shift();
        }
      }
    };

    const getTarget = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (range === "left") {
        return {
          x: 0,
          y: height / 2,
        };
      }
      if (range === "right") {
        return {
          x: width,
          y: height / 2,
        };
      }
      if (range === "top") {
        return {
          x: width / 2,
          y: 0,
        };
      }
      if (range === "bottom") {
        return {
          x: width / 2,
          y: height,
        };
      }

      let x = width / 2;
      let y = height / 2;

      if (lookAt) {
        if (typeof lookAt.x === "number") {
          x = lookAt.x;
        } else if (lookAt.x === "left") {
          x = 0;
        } else if (lookAt.x === "right") {
          x = width;
        } else if (lookAt.x === "center") {
          x = width / 2;
        }

        if (typeof lookAt.y === "number") {
          y = lookAt.y;
        } else if (lookAt.y === "top") {
          y = 0;
        } else if (lookAt.y === "bottom") {
          y = height;
        } else if (lookAt.y === "center") {
          y = height / 2;
        }
      }

      return { x, y };
    };

    const isInsideAllowedSection = (
      x,
      y
    ) => {
      if (!sections.length) {
        return true;
      }

      const element =
        document.elementFromPoint(x, y);

      if (!element) {
        return false;
      }

      return sections.some(
        (selector) =>
          element.closest(selector)
      );
    };

    const isInsideRange = (
      x,
      y
    ) => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      if (range === "left") {
        return x < width * 0.25;
      }
      if (range === "right") {
        return x > width * 0.75;
      }
      if (range === "top") {
        return y < height * 0.25;
      }
      if (range === "bottom") {
        return y > height * 0.75;
      }
      return false;
    };

    const normalizeAngle = (
      angle
    ) => {
      while (angle > 180) {
        angle -= 360;
      }
      while (angle < -180) {
        angle += 360;
      }
      return angle;
    };

    const update = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const mouseX =
        mouse.current.x;

      const mouseY =
        mouse.current.y;

      const allowed =
        isInsideAllowedSection(
          mouseX,
          mouseY
        );

      const insideRange =
        isInsideRange(
          mouseX,
          mouseY
        );

      const active =
        allowed &&
        insideRange;

      if (
        active !==
        activeRef.current
      ) {
        activeRef.current =
          active;
        onChange?.(active);
      }

      const root =
        document.documentElement;

      if (active) {
        root.style.setProperty(
          "--mask-clip-override",
          "polygon(0 0, 0 0, 0 0, 0 0)"
        );

        root.style.setProperty(
          "--mask-opacity",
          "0"
        );
      } else {
        root.style.removeProperty(
          "--mask-clip-override"
        );

        root.style.setProperty(
          "--mask-opacity",
          "1"
        );
      }

      if (ctx && canvas) {
        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
        );

        if (
          trail &&
          active
        ) {
          points.current.forEach(
            (point, index) => {
              const size =
                10 +
                index * 1.2;

              ctx.fillStyle =
                "#fff";

              ctx.beginPath();

              ctx.arc(
                point.x,
                point.y,
                size,
                0,
                Math.PI * 2
              );

              ctx.fill();
            }
          );
        } else {
          points.current = [];
        }
      }

      const element =
        arrowRef.current;

      if (!element) {
        frame =
          requestAnimationFrame(
            update
          );
        return;
      }

      if (active) {
        
        arrow.current.x +=
          (mouseX -
            arrow.current.x) *
          smooth;

        arrow.current.y +=
          (mouseY -
            arrow.current.y) *
          smooth;

        const target =
          getTarget();

        const dx =
          target.x -
          arrow.current.x;

        const dy =
          target.y -
          arrow.current.y;

        const targetAngle =
          Math.atan2(
            dy,
            dx
          ) *
          (180 / Math.PI);

        const difference =
          normalizeAngle(
            targetAngle -
              arrow.current.angle
          );

        arrow.current.angle +=
          difference *
          smooth;

        element.style.transform =
          `translate3d(` +
          `${arrow.current.x}px, ` +
          `${arrow.current.y}px, 0) ` +
          `rotate(` +
          `${arrow.current.angle}deg) ` +
          `scale(1)`;

        element.style.opacity =
          "1";

        onMove?.({
          x: mouseX,
          y: mouseY,
          targetX: target.x,
          targetY: target.y,
        });
      } else {

        arrow.current.x =
          mouseX;

        arrow.current.y =
          mouseY;

        element.style.transform =
          `translate3d(` +
          `${mouseX}px, ` +
          `${mouseY}px, 0) ` +
          `rotate(` +
          `${arrow.current.angle}deg) ` +
          `scale(0)`;

        element.style.opacity =
          "0";
      }

      frame =
        requestAnimationFrame(
          update
        );
    };

    resize();

    window.addEventListener(
      "resize",
      resize
    );

    window.addEventListener(
      "mousemove",
      move
    );

    frame =
      requestAnimationFrame(
        update
      );

    return () => {
      cancelAnimationFrame(frame);

      window.removeEventListener(
        "resize",
        resize
      );

      window.removeEventListener(
        "mousemove",
        move
      );

      document.documentElement.style.removeProperty(
        "--mask-clip-override"
      );

      document.documentElement.style.setProperty(
        "--mask-opacity",
        "1"
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
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 35 -11
              "
            />
          </filter>
        </defs>
      </svg>

      <div className="trail">
        <canvas
          ref={canvasRef}
        />
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