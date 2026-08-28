import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Work3D from "../components/Work3D";

function TextRise({ text, className, onExitComplete }) {
  const [shouldExit, setShouldExit] = useState(false);

  useEffect(() => {
    // 1. Holds the text fully visible and readable for 1.6 seconds
    const holdTimer = setTimeout(() => {
      setShouldExit(true);
    }, 1600);

    return () => clearTimeout(holdTimer);
  }, []);

  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {!shouldExit && (
        <div className={className} style={{ overflow: "hidden", display: "flex", justifyContent: "center" }}>
          {text.split("").map((char, idx) => (
            <motion.span
              key={idx}
              initial={{ y: "115%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ 
                y: "-115%", 
                opacity: 0, 
                transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1] } 
              }}
              transition={{
                duration: 0.8,
                ease: [0.16, 1, 0.3, 1],
                delay: idx * 0.04
              }}
              style={{
                display: "inline-block",
                whiteSpace: char === " " ? "pre" : "normal",
                willChange: "transform, opacity"
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

function Arrow({ sections }) {
  return (
    <div 
      className="arrow-guide-context" 
      data-trail="false"
      data-range="bottom"
      data-look-x="center"
      data-look-y="bottom"
      data-allowed-sections={JSON.stringify(sections)}
    >
      <span className="arrow-icon-element">↓</span>
    </div>
  );
}

export default function WhatIDo() {
  const sectionRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [animationStage, setAnimationStage] = useState("idle"); // "idle" | "text" | "cube"

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.85 && animationStage === "idle") {
          setAnimationStage("text");
        }
      },
      { threshold: [0, 0.85, 1.0] }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [animationStage]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePos.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={sectionRef} className="what-section" id="what-stage">
      <div className="sticky-viewport-track">
        
        {/* Stage 1: Text Rise & Text Fade-Out Sequence */}
        {animationStage === "text" && (
          <div className="intro-text-layer">
            <TextRise
              text="WHAT I DO ?"
              className="hero-heading"
              // Fires strictly AFTER the exit animation finishes fading out entirely
              onExitComplete={() => setAnimationStage("cube")}
            />
          </div>
        )}

        {/* Stage 2: Smooth Cube Entrance Sequence */}
        {animationStage === "cube" && (
          <motion.div
            initial={{ y: "100vh", opacity: 0, rotateX: 75, rotateY: -45, scale: 0.3 }}
            animate={{ y: 0, opacity: 1, rotateX: 0, rotateY: 0, scale: 1 }}
            transition={{ 
              duration: 1.5, 
              ease: [0.16, 1, 0.3, 1] // Pure cinematic curve matching WhoAmI
            }}
            className="fixed-canvas-wrapper"
          >
            <Work3D mousePos={mousePos} />
          </motion.div>
        )}

        <Arrow sections={[".what-section", "#what-stage"]} />

      </div>
    </div>
  );
}
