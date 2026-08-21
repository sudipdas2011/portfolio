import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import CustomCursor, { CursorEnlarge } from './components/CustomCursor';
import BrutalistLoader from './components/BrutalistLoader';
import TextRise from './components/TextRise';
import RevolvingStage from './components/RevolvingStage';
import './App.css';

// 1. Clean relative imports for images 1.jpg to 6.jpg
import img1 from './assets/cards/1.jpg';
import img2 from './assets/cards/2.jpg';
import img3 from './assets/cards/3.jpg';
import img4 from './assets/cards/4.jpg';
import img5 from './assets/cards/5.jpg';
import img6 from './assets/cards/6.jpg';

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
                  {/* 2. Passing the imported image variables into the revolving stage slots */}
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
        </div>
      )}
    </>
  );
}


/*is it updated*/