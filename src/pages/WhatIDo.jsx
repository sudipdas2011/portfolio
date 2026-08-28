import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Work3D from "../components/Work3D";
import ProxText from "../components/ProxText";

const SUB_PAGES = [
  {
    number: "01",
    title: "WEB DESIGN",
    kicker: "INTERFACE / SYSTEM",
    description:
      "Interfaces built around motion, structure, and a clear visual language.",
  },
  {
    number: "02",
    title: "3D",
    kicker: "FORM / SPACE",
    description:
      "Interactive 3D experiments where depth, light, and movement become part of the experience.",
  },
  {
    number: "03",
    title: "MOTION",
    kicker: "TIME / RHYTHM",
    description:
      "Motion systems that give interfaces a sense of timing, personality, and direction.",
  },
];

const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export default function WhatIDo() {
  const sectionRef = useRef(null);
  const progressRef = useRef(0);
  const wheelLockRef = useRef(false);

  const [isInView, setIsInView] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  /*
   * Detect when the section is actually the active viewport section.
   */
  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        threshold: 0.55,
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  /*
   * Intro timing.
   *
   * WHAT I DO ? gets its own 1.6 second entrance.
   * Only after that does the 3D work stage become active.
   */
  useEffect(() => {
    if (!isInView) {
      setIntroDone(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIntroDone(true);
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [isInView]);

  /*
   * Convert normalized progress into the current work page.
   */
  const updateProgress = useCallback((nextProgress) => {
    const next = clamp(nextProgress, 0, 1);

    progressRef.current = next;
    setProgress(next);

    const nextIndex = Math.min(
      SUB_PAGES.length - 1,
      Math.round(next * (SUB_PAGES.length - 1))
    );

    setActiveIndex(nextIndex);
  }, []);

  /*
   * Vertical wheel input becomes horizontal progress.
   *
   * IMPORTANT:
   * At the beginning/end we DO NOT preventDefault().
   * That lets the browser naturally continue into the previous/next
   * main section.
   */
  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return undefined;

    const handleWheel = (event) => {
      if (!isInView || !introDone) return;

      const current = progressRef.current;
      const goingForward = event.deltaY > 0;

      const atStart = current <= 0.001;
      const atEnd = current >= 0.999;

      if (
        (goingForward && atEnd) ||
        (!goingForward && atStart)
      ) {
        return;
      }

      event.preventDefault();

      if (wheelLockRef.current) return;

      wheelLockRef.current = true;

      /*
       * Normalize wheel input so trackpads and mouse wheels
       * don't behave wildly differently.
       */
      const amount = clamp(
        event.deltaY / 900,
        -0.16,
        0.16
      );

      updateProgress(current + amount);

      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 80);
    };

    section.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    return () => {
      section.removeEventListener("wheel", handleWheel);
    };
  }, [introDone, isInView, updateProgress]);

  /*
   * Keyboard support.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isInView || !introDone) return;

      if (
        event.key !== "ArrowRight" &&
        event.key !== "ArrowLeft"
      ) {
        return;
      }

      const direction =
        event.key === "ArrowRight" ? 1 : -1;

      const current = progressRef.current;

      if (
        (direction < 0 && current <= 0.001) ||
        (direction > 0 && current >= 0.999)
      ) {
        return;
      }

      event.preventDefault();

      updateProgress(
        current + direction / (SUB_PAGES.length - 1)
      );
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [introDone, isInView, updateProgress]);

  const horizontalPercent =
    progress * (SUB_PAGES.length - 1) * 100;

  return (
    <section
      ref={sectionRef}
      id="what-stage"
      className="what-section"
      aria-label="What I do"
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
        background: "#000",
        color: "#fff",
        isolation: "isolate",
      }}
    >
      {/* =========================================================
          INTRO
      ========================================================= */}

      <AnimatePresence>
        {isInView && !introDone && (
          <motion.div
            key="what-intro"
            initial={{
              opacity: 0,
              y: "12vh",
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: "-10vh",
              filter: "blur(8px)",
            }}
            transition={{
              duration: 1.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 30,
              display: "grid",
              placeItems: "center",
              pointerEvents: "none",
            }}
          >
            <ProxText
              text="WHAT I DO ?"
              className="what-prox-title"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          MAIN WORK STAGE
      ========================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: "24vh",
          rotate: -4,
        }}
        animate={
          introDone
            ? {
                opacity: 1,
                y: 0,
                rotate: 0,
              }
            : {
                opacity: 0,
                y: "24vh",
                rotate: -4,
              }
        }
        transition={{
          duration: 1.15,
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: introDone ? "auto" : "none",
        }}
      >
        {/* =======================================================
            CENTERED 3D OBJECT

            This does NOT move horizontally.

            The editorial pages move around it.
        ======================================================= */}

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "min(58vw, 620px)",
            height: "min(58vw, 620px)",
            minWidth: "300px",
            minHeight: "300px",
            transform: "translate(-50%, -50%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        >
          <Work3D activeIndex={activeIndex} />
        </div>

        {/* =======================================================
            HORIZONTAL WORK PAGES
        ======================================================= */}

        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{
              x: `${-horizontalPercent}vw`,
            }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 22,
              mass: 0.65,
            }}
            style={{
              display: "flex",
              width: `${SUB_PAGES.length * 100}vw`,
              height: "100%",
              willChange: "transform",
            }}
          >
            {SUB_PAGES.map((page) => (
              <article
                key={page.number}
                style={{
                  position: "relative",
                  flex: "0 0 100vw",
                  width: "100vw",
                  height: "100%",
                  boxSizing: "border-box",
                  padding:
                    "clamp(24px, 4vw, 64px)",
                }}
              >
                {/* PAGE NUMBER */}

                <div
                  style={{
                    position: "absolute",
                    top:
                      "clamp(24px, 4vw, 64px)",
                    left:
                      "clamp(24px, 4vw, 64px)",
                    fontFamily: "monospace",
                    fontSize: "10px",
                    letterSpacing: "0.16em",
                    opacity: 0.6,
                  }}
                >
                  {page.number} /{" "}
                  {String(SUB_PAGES.length).padStart(
                    2,
                    "0"
                  )}
                </div>

                {/* TEXT */}

                <div
                  style={{
                    position: "absolute",
                    left:
                      "clamp(24px, 4vw, 64px)",
                    bottom:
                      "clamp(28px, 5vw, 72px)",
                    width: "min(34vw, 420px)",
                    minWidth: "260px",
                  }}
                >
                  <div
                    style={{
                      borderLeft:
                        "3px solid #fff",
                      paddingLeft: "14px",
                      marginBottom: "18px",
                      fontFamily: "monospace",
                      fontSize: "10px",
                      letterSpacing: "0.18em",
                      opacity: 0.65,
                    }}
                  >
                    {page.kicker}
                  </div>

                  <h2
                    style={{
                      margin: 0,
                      fontSize:
                        "clamp(28px, 5vw, 72px)",
                      lineHeight: 0.9,
                      letterSpacing: "-0.045em",
                      fontWeight: 900,
                    }}
                  >
                    {page.title}
                  </h2>

                  <p
                    style={{
                      maxWidth: "320px",
                      margin: "18px 0 0",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      letterSpacing: "0.02em",
                      opacity: 0.65,
                    }}
                  >
                    {page.description}
                  </p>
                </div>
              </article>
            ))}
          </motion.div>
        </div>

        {/* =======================================================
            TOP RIGHT STATUS
        ======================================================= */}

        <div
          style={{
            position: "absolute",
            top:
              "clamp(24px, 4vw, 64px)",
            right:
              "clamp(24px, 4vw, 64px)",
            zIndex: 10,
            textAlign: "right",
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "0.12em",
            opacity: 0.6,
            pointerEvents: "none",
          }}
        >
          <div>SCROLL TO EXPLORE</div>

          <div
            style={{
              marginTop: "8px",
            }}
          >
            {String(activeIndex + 1).padStart(
              2,
              "0"
            )}{" "}
            —{" "}
            {String(SUB_PAGES.length).padStart(
              2,
              "0"
            )}
          </div>
        </div>

        {/* =======================================================
            PROGRESS BAR
        ======================================================= */}

        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom:
              "clamp(22px, 4vw, 50px)",
            width: "min(180px, 28vw)",
            height: "2px",
            transform: "translateX(-50%)",
            background:
              "rgba(255,255,255,0.18)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          <motion.div
            animate={{
              scaleX: Math.max(
                progress,
                0.035
              ),
            }}
            transition={{
              type: "spring",
              stiffness: 130,
              damping: 24,
            }}
            style={{
              width: "100%",
              height: "100%",
              transformOrigin: "left",
              background: "#fff",
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}