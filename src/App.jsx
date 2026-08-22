import { useState, useSyncExternalStore  } from 'react';
import useAssetLoader from './hooks/useAssetLoader'; 

import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import CustomCursor from './components/CustomCursor';
import BrutalistLoader from './components/BrutalistLoader';
import TextRise from './components/TextRise';
import RevolvingStage from './components/RevolvingStage';
import './App.css';

import img1 from './assets/cards/1.jpg';
import img2 from './assets/cards/2.jpg';
import img3 from './assets/cards/3.jpg';
import img4 from './assets/cards/4.jpg';
import img5 from './assets/cards/5.jpg';
import img6 from './assets/cards/6.jpg';

// Define assets outside the component to keep references stable
const ASSETS_TO_LOAD = [img1, img2, img3, img4, img5, img6, heroImg];

export default function App() {
  const [textAnimationDone, setTextAnimationDone] = useState(false);

  // 1. Use the clean template hook here
  const { showLoader, percent, handleLoaderComplete } = useAssetLoader(ASSETS_TO_LOAD, "Portfolio");

  return (
    <>
      <CustomCursor />
      {showLoader ? (
        // 2. You can optionally pass the `percent` state down to BrutalistLoader if it supports a text counter
        <BrutalistLoader onComplete={handleLoaderComplete} debug={false} progress={percent} />
      ) : (
        <div className="portfolio-content">
          <main className="hero-section">
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
                  radius={Math.min(window.innerWidth, window.innerHeight) * 0.3}
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
        </div>
      )}
    </>
  );
}
