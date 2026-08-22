import { useState, useSyncExternalStore } from 'react';
import useAssetLoader from './hooks/useAssetLoader'; 

import reactLogo from './assets/react.svg';
import viteLogo from './assets/vite.svg';
import heroImg from './assets/hero.png';
import CustomCursor from './components/CustomCursor';
import BrutalistLoader from './components/BrutalistLoader';
import Hero from './pages/Hero'; 
import WhoAmI from './pages/WhoAmI'; 
import './App.css';

import img1 from './assets/cards/1.jpg';
import img2 from './assets/cards/2.jpg';
import img3 from './assets/cards/3.jpg';
import img4 from './assets/cards/4.jpg';
import img5 from './assets/cards/5.jpg';
import img6 from './assets/cards/6.jpg';

const ASSETS_TO_LOAD = [img1, img2, img3, img4, img5, img6, heroImg];

export default function App() {
  const { showLoader, percent, handleLoaderComplete } = useAssetLoader(ASSETS_TO_LOAD, "Portfolio");

  return (
    <>
      {/* 
        The CustomCursor remains global across the whole website view tree layer,
        but ArrowGuide has been cleanly purged from this root scope.
      */}
      <CustomCursor />
      
      {showLoader ? (
        <BrutalistLoader onComplete={handleLoaderComplete} debug={false} progress={percent} />
      ) : (
        <div className="portfolio-content">
          <Hero />
          <WhoAmI />
        </div>
      )}
    </>
  );
}
