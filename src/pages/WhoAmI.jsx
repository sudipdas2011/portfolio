import React, { useState, useEffect, useRef } from 'react';
import TextRise from '../components/TextRise';

export default function WhoAmI() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // FIXED: Corrected the state dispatcher reference to run the trigger accurately
          setIsVisible(true);
        }
      },
      { 
        // Triggers the text rise animation as soon as the top edge enters the monitor view
        threshold: 0.8 
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section 
      ref={sectionRef} 
      className="who-section"
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000000", /* Flat brutalist solid black background layout */
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      <div 
        id="who-title" 
        style={{ 
          transform: `scale(${(window.innerWidth * 0.0003).toFixed(2)})`, 
          transformOrigin: "center",
          
          /* 
            THE senior INVERSION FILTER FIX:
            Since TextRise locks internal text tags to solid black (#000000), 
            applying invert(1) instantly flips the color to pure white (#ffffff). 
            Brightness(2) ensures it stays sharp and high-contrast against images.
          */
          filter: "invert(1) brightness(2)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {isVisible && (
          <div 
            id="hero-title" 
            style={{ 
              transform: `scale(${(window.innerWidth * 0.0007).toFixed(2)})`, 
              transformOrigin: "center" 
            }}
          >
            <TextRise 
              text="who am i ?" 
              className="hero-heading" 
              onComplete={() => console.log("WhoAmI text animation finished.")}
            />
          </div>
        )}
      </div>
    </section>
  );
}
