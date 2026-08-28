import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Work3D from "../components/Work3D";

function TextRise({ text, className, onComplete }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div ref={containerRef} className={className} style={{ overflow: "hidden" }}>
      {text.split("").map((char, idx) => (
        <motion.span
          key={idx}
          initial={{ y: "110%", opacity: 0 }}
          animate={{ 
            y: ["110%", "0%", "-50%"], 
            opacity: [0, 1, 0] // Corrected keyframe array format
          }}
          transition={{
            times: [0, 0.35, 1],
            duration: 1.6,
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
  );
}

function Arrow({ trail, range, lookAt, sections }) {
  return (
    <div 
      className="arrow-guide-context" 
      data-trail={trail ? "true" : "false"}
      data-range={range}
      data-look-x={lookAt.x}
      data-look-y={lookAt.y}
      data-allowed-sections={JSON.stringify(sections)}
    >
      <span className="arrow-icon-element">↓</span>
    </div>
  );
}

export default function WhatIDo() {
  const sectionRef = useRef(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [isInView, setIsInView] = useState(false);
  const [textDone, setTextDone] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Lower threshold handles the overlap issue with snap tracks
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 } 
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

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
        
        {isInView && !textDone && (
          <div className="intro-text-layer">
            <TextRise
              text="WHAT I DO ?"
              className="hero-heading"
              onComplete={() => setTextDone(true)}
            />
          </div>
        )}

        {textDone && (
          <motion.div
            initial={{ y: "30vh", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            className="fixed-canvas-wrapper"
          >
            <Work3D activeIndex={0} mousePos={mousePos} />
          </motion.div>
        )}

        <Arrow
          trail={false}
          range="bottom"
          lookAt={{ x: "center", y: "bottom" }}
          sections={[".what-section", "#what-stage"]}
        />

      </div>
    </div>
  );
}
