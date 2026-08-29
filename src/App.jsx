import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAssetLoader from './hooks/useAssetLoader'; 
import Cursor from './components/Cursor';
import Loader from './components/Loader';
import Hero from './pages/Hero'; 
import WhoAmI from './pages/WhoAmI'; 
import WhatIDo from './pages/WhatIDo'; 
import Carousel from './components/Carousel'; 
import Contact from './pages/Contact';
import NotFound from './pages/404'; 
import './App.css';
import img1 from './assets/cards/1.jpg';
import img2 from './assets/cards/2.jpg';
import img3 from './assets/cards/3.jpg';
import img4 from './assets/cards/4.jpg';
import img5 from './assets/cards/5.jpg';
import img6 from './assets/cards/6.jpg';

const ASSETS_TO_LOAD = [img1, img2, img3, img4, img5, img6];

function MainPortfolioView() {
  return (
    <div className="portfolio-content snap-scroll-parent">
      <section className="snap-section"><Hero /></section>
      <section className="snap-section"><WhoAmI /></section>
      <section className="snap-section"><WhatIDo /></section>
      <section 
        className="snap-section" 
        style={{ 
          width: '100vw', 
          height: '100vh', 
          position: 'relative', 
          overflow: 'hidden',
          backgroundColor: '#000000' 
        }}
      >
        <Carousel />
      </section>
      <section className="snap-section"><Contact /></section>
    </div>
  );
}

export default function App() {
  const { showLoader, percent, handleLoaderComplete } = useAssetLoader(ASSETS_TO_LOAD, "Portfolio");

  return (
    <BrowserRouter basename="/portfolio">
      <Cursor />
      
      {showLoader ? (
        <Loader onComplete={handleLoaderComplete} debug={false} progress={percent} />
      ) : (
        <Routes>
          <Route path="/" element={<MainPortfolioView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}

//hshshshs shshbs sjsns 