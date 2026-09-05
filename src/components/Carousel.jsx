import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { createCarousel } from "../gl/scene";

const Carousel = () => {
  const canvasRef =
    useRef(null);

  const cleanupFunctionRef =
    useRef(null);

  const [activeIndex, setActiveIndex] =
    useState(0);

  useEffect(() => {
    let animationFrameId;
    let isDestroyed = false;

    const initializeEngine = () => {
      if (isDestroyed) return;

      if (!canvasRef.current) {
        animationFrameId =
          requestAnimationFrame(
            initializeEngine
          );

        return;
      }

      try {
        cleanupFunctionRef.current =
          createCarousel(
            canvasRef.current,
            {
              onActiveChange: (idx) => {
                setActiveIndex(idx);
              },
            }
          );
      } catch (err) {
        console.error(
          "Carousel error:",
          err
        );
      }
    };

    animationFrameId =
      requestAnimationFrame(
        initializeEngine
      );

    return () => {
      isDestroyed = true;

      cancelAnimationFrame(
        animationFrameId
      );

      cleanupFunctionRef.current?.();
    };
  }, []);

  const filenames = [
    "1.jpg",
    "2.jpg",
    "3.jpg",
    "4.jpg",
    "5.jpg",
    "6.jpg",
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#000000",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          zIndex: 31,
          touchAction: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          zIndex: 32,
          background: "#000000",
          border: "1px solid #333",
          borderRadius: "0px",
          overflow: "hidden",
          width: "25vw",
          display: "flex",
          flexDirection: "column",
          scrollbarWidth: "none",
        }}
      >
        <style>{`
          .carousel-menu::-webkit-scrollbar {
            display: none;
          }
        `}</style>

        <div
          className="carousel-menu"
          style={{
            flex: 1,
            overflowY: "auto",
            scrollbarWidth: "none",
            msOverflowStyle:
              "none",
          }}
        >
          {filenames.map(
            (filename, index) => (
              <div
                key={index}
                style={{
                  padding:
                    "2px 5px",

                  fontSize:
                    "13px",

                  fontFamily:
                    "monospace",

                  color:
                    activeIndex ===
                    index
                      ? "#000000"
                      : "#888888",

                  background:
                    activeIndex ===
                    index
                      ? "#ffffff"
                      : "#000000",

                  borderLeft:
                    activeIndex ===
                    index
                      ? "3px solid #ffffff"
                      : "3px solid #000000",

                  cursor:
                    "pointer",

                  transition:
                    "all 0.3s ease",

                  letterSpacing:
                    "0.5px",

                  whiteSpace:
                    "nowrap",

                  fontWeight:
                    activeIndex ===
                    index
                      ? "600"
                      : "normal",

                  userSelect:
                    "none",
                }}
                onMouseEnter={(e) => {
                  if (
                    activeIndex !==
                    index
                  ) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.08)";

                    e.currentTarget.style.color =
                      "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (
                    activeIndex !==
                    index
                  ) {
                    e.currentTarget.style.background =
                      "#000000";

                    e.currentTarget.style.color =
                      "#888888";
                  }
                }}
              >
                {filename}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Carousel;