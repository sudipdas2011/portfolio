import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import CustomCursor, { CursorEnlarge } from './components/CustomCursor';
import BrutalistLoader from './components/BrutalistLoader';
import TextRise from './components/TextRise';
import RevolvingStage from './components/RevolvingStage';
import './App.css';

export default function App() {
  const [showLoader, setShowLoader] = useState(true);
  const [textAnimationDone, setTextAnimationDone] = useState(false);

  return (
    <>
      <CustomCursor />
      
      {showLoader ? (
        <BrutalistLoader onComplete={() => setShowLoader(false)} debug={false} />
      ) : (
        <div className="portfolio-content">
          <main className="hero-section">
            <div className="center-stage">
              
              <div id="hero-title" style={{ transform: `scale(${(window.innerWidth * 0.0003).toFixed(2)})`, transformOrigin: "center" }}>
                <TextRise
                  text="sudip das." 
                  className="hero-heading" 
                  onComplete={() => setTextAnimationDone(true)} 
                />
              </div>
              
              {/* 
                - rpm: Rotations per minute for the overall orbit loop
                - easeType: "easeIn", "easeOut", "easeInOut", or "linear" applied to the revolution trail
              */}
              {textAnimationDone && (
                <RevolvingStage targetId="hero-title" radius={window.innerHeight * 0.3} rpm={1.6} easeType="linear">
                  {/*<img src={heroImg} alt="Hero" className="card-media" />*/}
                  <img src="../src/assets/cards/ilum.jpg" alt="Hero" className="card-media" />
                  <img src="../src/assets/cards/096f041b46086a2e8fabb1bcdc0cde8b.jpg" alt="Hero" className="card-media" />
                  <img src="../src/assets/cards/jpn_falling.jpg" alt="Hero" className="card-media" />
                  <img src="../src/assets/cards/rim_or_a.jpg" alt="Hero" className="card-media" />
                  <img src="../src/assets/cards/shooting_star.jpg" alt="Hero" className="card-media" />
                  <img src="../src/assets/cards/synthetic_eden.jpg" alt="Hero" className="card-media" />
                  <img src="../src/assets/cards/spring_exhibition.jpg" alt="Hero" className="card-media" />
                </RevolvingStage>
              )}
              
            </div>
          </main>
        </div>
      )}
    </>
  );
}
