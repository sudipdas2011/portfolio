import useAssetLoader from './hooks/useAssetLoader'; 
import Cursor from './components/Cursor';
import Loader from './components/Loader';
import Hero from './pages/Hero'; 
import WhoAmI from './pages/WhoAmI'; 
import './App.css';
import img1 from './assets/cards/1.jpg';
import img2 from './assets/cards/2.jpg';
import img3 from './assets/cards/3.jpg';
import img4 from './assets/cards/4.jpg';
import img5 from './assets/cards/5.jpg';
import img6 from './assets/cards/6.jpg';

const ASSETS_TO_LOAD = [img1, img2, img3, img4, img5, img6];

export default function App() {
  const { showLoader, percent, handleLoaderComplete } = useAssetLoader(ASSETS_TO_LOAD, "Portfolio");

  return (
    <>
      <Cursor />
      
      {showLoader ? (
        <Loader onComplete={handleLoaderComplete} debug={false} progress={percent} />
      ) : (
        <div className="portfolio-content">
          <Hero />
          <WhoAmI />
        </div>
      )}
    </>
  );
}
