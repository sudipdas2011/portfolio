import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAssetLoader from './hooks/useAssetLoader'; 
import Cursor from './components/Cursor';
import Loader from './components/Loader';
import Hero from './pages/Hero'; 
import WhoAmI from './pages/WhoAmI'; 
import NotFound from './pages/404'; // Import your new 404 page page
import './App.css';
import img1 from './assets/cards/1.jpg';
import img2 from './assets/cards/2.jpg';
import img3 from './assets/cards/3.jpg';
import img4 from './assets/cards/4.jpg';
import img5 from './assets/cards/5.jpg';
import img6 from './assets/cards/6.jpg';

const ASSETS_TO_LOAD = [img1, img2, img3, img4, img5, img6];

// Keeps your main stacked page stream neat and isolated
function MainPortfolioView() {
  return (
    <div className="portfolio-content">
      <Hero />
      <WhoAmI />
    </div>
  );
}

export default function App() {
  const { showLoader, percent, handleLoaderComplete } = useAssetLoader(ASSETS_TO_LOAD, "Portfolio");

  return (
    <BrowserRouter basename="/portfolio">
      {/* Retains your updated 'Cursor' reference name globally */}
      <Cursor />
      
      {showLoader ? (
        /* Retains your updated 'Loader' reference name */
        <Loader onComplete={handleLoaderComplete} debug={false} progress={percent} />
      ) : (
        <Routes>
          {/* Main homepage timeline route */}
          <Route path="/" element={<MainPortfolioView />} />

          {/* Catch-all wildcard path to intercept broken URLs */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
