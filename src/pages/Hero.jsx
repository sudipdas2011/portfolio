import React, { useState } from 'react';
import TextRise from '../components/TextRise';
import RevolvingStage from '../components/RevolvingStage';
import ArrowGuide from '../components/ArrowGuide'; // Imported safely here

import img1 from '../assets/cards/1.jpg';
import img2 from '../assets/cards/2.jpg';
import img3 from '../assets/cards/3.jpg';
import img4 from '../assets/cards/4.jpg';
import img5 from '../assets/cards/5.jpg';
import img6 from '../assets/cards/6.jpg';

export default function Hero() {
  const [textAnimationDone, setTextAnimationDone] = useState(false);

  return (
    <main className="hero-section">
      {/* 
        The ArrowGuide is now isolated inside the Hero component scope.
        It runs only within this 100vh viewport space.
      */}
      {/* App.jsx Integration */}
      <ArrowGuide 
        trail={false} 
        range="bottom" 
        lookAt={{ x: "center", y: "bottom" }} 
        /* 
          PASS THE TARGET LIST: 
          The arrow will ONLY activate when hovering directly over the hero section view.
          It will instantly drop and vanish over ".who-section" or any other listed path container.
        */
        allowedSections={[".hero-section", "#hero-stage"]} 
      />


      <div className="center-stage">
        <div 
          id="hero-title" 
          style={{ 
            transform: `scale(${(window.innerWidth * 0.0003).toFixed(2)})`, 
            transformOrigin: "center" 
          }}
        >
          <TextRise 
            text="sudip das." 
            className="hero-heading" 
            onComplete={() => setTextAnimationDone(true)} 
          />
        </div>

        {textAnimationDone && (
          <RevolvingStage 
            targetId="hero-title" 
            radius={Math.min(window.innerWidth, window.innerHeight) * 0.2}
            rpm={1.6} 
            easeType="linear"
          >
            <img src={img1} alt="Hero" className="card-media" />
            <img src={img2} alt="Hero" className="card-media" />
            <img src={img3} alt="Hero" className="card-media" />
            <img src={img4} alt="Hero" className="card-media" />
            <img src={img5} alt="Hero" className="card-media" />
            <img src={img6} alt="Hero" className="card-media" />
          </RevolvingStage>
        )}
      </div>
    </main>
  );
}
