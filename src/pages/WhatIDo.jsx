import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import TextRise from "../components/TextRise";
import Work3D from "../components/Work3D";
import Arrow from "../components/Arrow";

const SUB_PAGES = [
  {
    number: "01",
    title: "WEB DESIGN",
  },
  {
    number: "02",
    title: "3D",
  },
  {
    number: "03",
    title: "MOTION",
  },
];

const clamp = (value, min, max) =>
  Math.min(
    Math.max(value, min),
    max
  );

/* ================================================================
   SUBPAGE TYPOGRAPHY

   Waits 1.6 seconds after becoming active,
   then starts TextRise.

   Both title and number are scaled 2.5×.
================================================================ */

function SubPageTypography({
  page,
  isActive,
}) {
  const [shouldAnimate, setShouldAnimate] =
    useState(false);

  useEffect(() => {
    /*
     * Reset whenever this page becomes inactive.
     */
    if (!isActive) {
      setShouldAnimate(false);

      return undefined;
    }

    /*
     * Wait exactly 1.6 seconds after
     * the subpage becomes active.
     */
    const timer =
      window.setTimeout(() => {
        setShouldAnimate(true);
      }, 800);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isActive]);

  return (
    <>
      {/* ==========================================================
          SUBPAGE NAME
      ========================================================== */}

      <div
        style={{
          position: "absolute",

          left:
            "clamp(24px, 4vw, 64px)",

          bottom:
            "clamp(28px, 5vw, 64px)",

          margin: 0,

          transform:
            "scale(2.5)",

          transformOrigin:
            "left bottom",

          pointerEvents:
            "none",
        }}
      >
        <AnimatePresence mode="wait">
          {shouldAnimate && (
            <motion.div
              key={`title-${page.number}`}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <TextRise
                text={page.title}
                className="what-subpage-title"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ==========================================================
          NUMBER

          Same typography size and 2.5× scale.
      ========================================================== */}

      <div
        style={{
          position: "absolute",

          top:
            "clamp(24px, 4vw, 64px)",

          right:
            "clamp(24px, 4vw, 64px)",

          margin: 0,

          transform:
            "scale(2.5)",

          transformOrigin:
            "right top",

          pointerEvents:
            "none",
        }}
      >
        <AnimatePresence mode="wait">
          {shouldAnimate && (
            <motion.div
              key={`number-${page.number}`}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
            >
              <TextRise
                text={page.number}
                className="what-subpage-number"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

/* ================================================================
   WHAT I DO
================================================================ */

export default function WhatIDo() {
  const sectionRef =
    useRef(null);

  /*
   * Current subpage.
   *
   * 0 = 01
   * 1 = 02
   * 2 = 03
   */
  const pageRef =
    useRef(0);

  /*
   * Mouse X is used for arrow click detection.
   */
  const mouseXRef =
    useRef(
      typeof window !== "undefined"
        ? window.innerWidth / 2
        : 0
    );

  /*
   * Prevents multiple page changes
   * from one physical wheel gesture.
   */
  const wheelLockedRef =
    useRef(false);

  /*
   * Accumulates wheel movement.
   */
  const scrollAccumulatorRef =
    useRef(0);

  /*
   * Detects when trackpad momentum
   * has finished.
   */
  const releaseTimerRef =
    useRef(null);

  const [
    isActive,
    setIsActive,
  ] = useState(false);

  const [
    introDone,
    setIntroDone,
  ] = useState(false);

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    leftArrowVisible,
    setLeftArrowVisible,
  ] = useState(false);

  const [
    rightArrowVisible,
    setRightArrowVisible,
  ] = useState(false);

  /* ==============================================================
     SECTION VISIBILITY

     Intro begins when WhatIDo reaches 85%.
  ============================================================== */

  useEffect(() => {
    const section =
      sectionRef.current;

    if (!section) {
      return undefined;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) => {
          setIsActive(
            entry.isIntersecting &&
              entry.intersectionRatio >=
                0.85
          );
        },
        {
          threshold: [
            0,
            0.5,
            0.75,
            0.85,
            0.9,
            1,
          ],
        }
      );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ==============================================================
     INTRO TIMING
  ============================================================== */

  useEffect(() => {
    if (!isActive) {
      setIntroDone(false);

      return undefined;
    }

    const timer =
      window.setTimeout(() => {
        setIntroDone(true);
      }, 2000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isActive]);

  /* ==============================================================
     MOUSE TRACKING
  ============================================================== */

  useEffect(() => {
    const handleMouseMove =
      (event) => {
        mouseXRef.current =
          event.clientX;
      };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    return () => {
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );
    };
  }, []);

  /* ==============================================================
     PAGE NAVIGATION
  ============================================================== */

  const goToPage =
    useCallback(
      (index) => {
        const nextIndex =
          clamp(
            index,
            0,
            SUB_PAGES.length - 1
          );

        pageRef.current =
          nextIndex;

        setActiveIndex(
          nextIndex
        );
      },
      []
    );

  /* ==============================================================
     WHEEL NAVIGATION

     Slow and deliberate.

     Small wheel movement:
       → accumulate

     Enough movement:
       → change exactly one page

     Trackpad momentum:
       → locked

     This prevents:

       02 → 03 → 02 → 03
  ============================================================== */

  useEffect(() => {
    const section =
      sectionRef.current;

    if (!section) {
      return undefined;
    }

    /*
     * Higher = more scrolling required.
     *
     * 140 gives a noticeably slower
     * and more deliberate feel.
     */
    const SCROLL_THRESHOLD =
      140;

    const handleWheel =
      (event) => {
        if (
          !isActive ||
          !introDone
        ) {
          return;
        }

        const delta =
          event.deltaY;

        /*
         * Ignore tiny trackpad noise.
         */
        if (
          Math.abs(delta) < 1
        ) {
          return;
        }

        const direction =
          delta > 0 ? 1 : -1;

        const currentPage =
          pageRef.current;

        const atFirstPage =
          currentPage === 0;

        const atLastPage =
          currentPage ===
          SUB_PAGES.length - 1;

        /* --------------------------------------------------------
           FIRST PAGE + UP

           Release wheel to the normal page.
        -------------------------------------------------------- */

        if (
          atFirstPage &&
          direction < 0
        ) {
          scrollAccumulatorRef.current =
            0;

          wheelLockedRef.current =
            false;

          if (
            releaseTimerRef.current
          ) {
            window.clearTimeout(
              releaseTimerRef.current
            );
          }

          return;
        }

        /* --------------------------------------------------------
           LAST PAGE + DOWN

           Release wheel to the normal page.
        -------------------------------------------------------- */

        if (
          atLastPage &&
          direction > 0
        ) {
          scrollAccumulatorRef.current =
            0;

          wheelLockedRef.current =
            false;

          if (
            releaseTimerRef.current
          ) {
            window.clearTimeout(
              releaseTimerRef.current
            );
          }

          return;
        }

        /*
         * We are inside the subpage sequence.
         */
        event.preventDefault();

        /* --------------------------------------------------------
           GESTURE LOCK
        -------------------------------------------------------- */

        if (
          wheelLockedRef.current
        ) {
          /*
           * Trackpad is still generating
           * momentum events.
           */
          if (
            releaseTimerRef.current
          ) {
            window.clearTimeout(
              releaseTimerRef.current
            );
          }

          releaseTimerRef.current =
            window.setTimeout(
              () => {
                wheelLockedRef.current =
                  false;

                scrollAccumulatorRef.current =
                  0;
              },
              260
            );

          return;
        }

        /* --------------------------------------------------------
           ACCUMULATE SCROLL
        -------------------------------------------------------- */

        const previous =
          scrollAccumulatorRef.current;

        /*
         * If direction reverses,
         * start fresh.
         */
        if (
          previous !== 0 &&
          Math.sign(previous) !==
            direction
        ) {
          scrollAccumulatorRef.current =
            delta;
        } else {
          scrollAccumulatorRef.current +=
            delta;
        }

        /*
         * Detect end of small scroll movement.
         */
        if (
          releaseTimerRef.current
        ) {
          window.clearTimeout(
            releaseTimerRef.current
          );
        }

        releaseTimerRef.current =
          window.setTimeout(
            () => {
              scrollAccumulatorRef.current =
                0;
            },
            180
          );

        /*
         * Not enough scrolling yet.
         */
        if (
          Math.abs(
            scrollAccumulatorRef.current
          ) <
          SCROLL_THRESHOLD
        ) {
          return;
        }

        /* --------------------------------------------------------
           ONE PAGE ONLY
        -------------------------------------------------------- */

        wheelLockedRef.current =
          true;

        scrollAccumulatorRef.current =
          0;

        const nextPage =
          clamp(
            currentPage +
              direction,
            0,
            SUB_PAGES.length - 1
          );

        if (
          nextPage !==
          currentPage
        ) {
          goToPage(
            nextPage
          );
        }

        /* --------------------------------------------------------
           WAIT FOR TRACKPAD MOMENTUM
        -------------------------------------------------------- */

        if (
          releaseTimerRef.current
        ) {
          window.clearTimeout(
            releaseTimerRef.current
          );
        }

        releaseTimerRef.current =
          window.setTimeout(
            () => {
              wheelLockedRef.current =
                false;

              scrollAccumulatorRef.current =
                0;
            },
            420
          );
      };

    section.addEventListener(
      "wheel",
      handleWheel,
      {
        passive: false,
      }
    );

    return () => {
      section.removeEventListener(
        "wheel",
        handleWheel
      );

      if (
        releaseTimerRef.current
      ) {
        window.clearTimeout(
          releaseTimerRef.current
        );
      }

      scrollAccumulatorRef.current =
        0;

      wheelLockedRef.current =
        false;
    };
  }, [
    isActive,
    introDone,
    goToPage,
  ]);

  /* ==============================================================
     KEYBOARD NAVIGATION
  ============================================================== */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        if (
          !isActive ||
          !introDone
        ) {
          return;
        }

        if (
          event.key !==
            "ArrowLeft" &&
          event.key !==
            "ArrowRight"
        ) {
          return;
        }

        const direction =
          event.key ===
          "ArrowRight"
            ? 1
            : -1;

        const currentPage =
          pageRef.current;

        /*
         * At boundaries allow normal
         * page behavior.
         */
        if (
          currentPage === 0 &&
          direction < 0
        ) {
          return;
        }

        if (
          currentPage ===
            SUB_PAGES.length - 1 &&
          direction > 0
        ) {
          return;
        }

        event.preventDefault();

        goToPage(
          currentPage +
            direction
        );
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isActive,
    introDone,
    goToPage,
  ]);

  /* ==============================================================
     ARROW VISIBILITY
  ============================================================== */

  const handleLeftArrowChange =
    useCallback(
      (active) => {
        setLeftArrowVisible(
          active
        );
      },
      []
    );

  const handleRightArrowChange =
    useCallback(
      (active) => {
        setRightArrowVisible(
          active
        );
      },
      []
    );

  /* ==============================================================
     ARROW CLICK
  ============================================================== */

  useEffect(() => {
    const handleClick =
      () => {
        if (
          !isActive ||
          !introDone
        ) {
          return;
        }

        const x =
          mouseXRef.current;

        const width =
          window.innerWidth;

        const currentPage =
          pageRef.current;

        /*
         * LEFT 25%
         */
        if (
          x < width * 0.25 &&
          leftArrowVisible &&
          currentPage > 0
        ) {
          goToPage(
            currentPage - 1
          );

          return;
        }

        /*
         * RIGHT 25%
         */
        if (
          x > width * 0.75 &&
          rightArrowVisible &&
          currentPage <
            SUB_PAGES.length - 1
        ) {
          goToPage(
            currentPage + 1
          );
        }
      };

    window.addEventListener(
      "click",
      handleClick
    );

    return () => {
      window.removeEventListener(
        "click",
        handleClick
      );
    };
  }, [
    isActive,
    introDone,
    leftArrowVisible,
    rightArrowVisible,
    goToPage,
  ]);

  /* ==============================================================
     TRACK POSITION
  ============================================================== */

  const horizontalX =
    -activeIndex * 100;

  const leftHasPage =
    activeIndex > 0;

  const rightHasPage =
    activeIndex <
    SUB_PAGES.length - 1;

  /* ==============================================================
     RENDER
  ============================================================== */

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
      {/* ==========================================================
          LEFT ARROW
      ========================================================== */}

      {leftHasPage && (
        <Arrow
          range="left"
          smooth={0.12}
          sections={[
            "#what-stage",
          ]}
          onChange={
            handleLeftArrowChange
          }
        />
      )}

      {/* ==========================================================
          RIGHT ARROW
      ========================================================== */}

      {rightHasPage && (
        <Arrow
          range="right"
          smooth={0.12}
          sections={[
            "#what-stage",
          ]}
          onChange={
            handleRightArrowChange
          }
        />
      )}

      {/* ==========================================================
          WHAT I DO ?

          Starts when section reaches 85%.
      ========================================================== */}

      <AnimatePresence>
        {isActive &&
          !introDone && (
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
                filter:
                  "blur(8px)",
              }}
              transition={{
                duration: 1.1,

                ease: [
                  0.16,
                  1,
                  0.3,
                  1,
                ],
              }}
              style={{
                position:
                  "absolute",

                inset: 0,

                zIndex: 30,

                display: "grid",

                placeItems:
                  "center",

                pointerEvents:
                  "none",
              }}
            >
              <div
                style={{
                  transform:
                    "scale(2)",

                  transformOrigin:
                    "center",
                }}
              >
                <TextRise
                  text="w h a t   i   d o   ?"
                  className="what-intro-title"
                />
              </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* ==========================================================
          MAIN STAGE
      ========================================================== */}

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

          ease: [
            0.16,
            1,
            0.3,
            1,
          ],
        }}
        style={{
          position: "absolute",

          inset: 0,

          zIndex: 5,

          pointerEvents:
            introDone
              ? "auto"
              : "none",
        }}
      >
        {/* ========================================================
            3D MODEL
        ======================================================== */}

        <div
          style={{
            position: "absolute",

            left: "50%",
            top: "50%",

            width:
              "min(58vw, 620px)",

            height:
              "min(58vw, 620px)",

            minWidth: "300px",
            minHeight: "300px",

            transform:
              "translate(-50%, -50%)",

            zIndex: 2,

            pointerEvents:
              "none",
          }}
        >
          <Work3D
            activeIndex={
              activeIndex
            }
          />
        </div>

        {/* ========================================================
            SUBPAGE TRACK
        ======================================================== */}

        <div
          style={{
            position: "absolute",

            inset: 0,

            zIndex: 6,

            overflow: "hidden",

            pointerEvents:
              "none",
          }}
        >
          <motion.div
            animate={{
              x: `${horizontalX}vw`,
            }}
            transition={{
              type: "spring",

              stiffness: 75,

              damping: 24,

              mass: 0.9,
            }}
            style={{
              display: "flex",

              width:
                `${SUB_PAGES.length * 100}vw`,

              height: "100%",

              willChange:
                "transform",
            }}
          >
            {SUB_PAGES.map(
              (
                page,
                index
              ) => (
                <article
                  key={
                    page.number
                  }
                  style={{
                    position:
                      "relative",

                    flex:
                      "0 0 100vw",

                    width: "100vw",

                    height: "100%",

                    boxSizing:
                      "border-box",
                  }}
                >
                  <SubPageTypography
                    page={page}
                    isActive={
                      index ===
                      activeIndex
                    }
                  />
                </article>
              )
            )}
          </motion.div>
        </div>

        {/* ========================================================
            BOTTOM SCROLL INDICATOR
        ======================================================== */}

        <div
          style={{
            position: "absolute",

            left: "50%",

            bottom:
              "clamp(22px, 4vw, 50px)",

            width:
              "min(180px, 28vw)",

            height: "2px",

            transform:
              "translateX(-50%)",

            background:
              "rgba(255,255,255,0.18)",

            zIndex: 10,

            pointerEvents:
              "none",
          }}
        >
          <motion.div
            animate={{
              scaleX:
                (activeIndex + 1) /
                SUB_PAGES.length,
            }}
            transition={{
              type: "spring",

              stiffness: 80,

              damping: 24,

              mass: 0.8,
            }}
            style={{
              width: "100%",

              height: "100%",

              transformOrigin:
                "left",

              background: "#fff",
            }}
          />
        </div>
      </motion.div>
    </section>
  );
}