import { useState } from 'react';
import TextRise from '../components/TextRise';
import Orbit from '../components/Orbit';
import Arrow from '../components/Arrow';
import img1 from '../assets/cards/1.jpg';
import img2 from '../assets/cards/2.jpg';
import img3 from '../assets/cards/3.jpg';
import img4 from '../assets/cards/4.jpg';
import img5 from '../assets/cards/5.jpg';
import img6 from '../assets/cards/6.jpg';

export default function Hero() {
  const [textDone, setTextDone] = useState(false);

  return (
    <main className="hero-section">
      <Arrow
        trail={false}
        range="bottom"
        lookAt={{ x: 'center', y: 'bottom' }}
        sections={['.hero-section', '#hero-stage']}
      />

      <div className="center-stage">
        <div
          id="hero-title"
          style={{
            transform: `scale(${(
              window.innerWidth * 0.0003
            ).toFixed(2)})`,
            transformOrigin: 'center',
          }}
        >
          <TextRise
            text="sudip das."
            className="hero-heading"
            onComplete={() => setTextDone(true)}
          />
        </div>

        {textDone && (
          <Orbit
            targetId="hero-title"
            radius={
              Math.min(
                window.innerWidth,
                window.innerHeight
              ) * 0.2
            }
            rpm={1.6}
            ease="linear"
          >
            <img src={img1} alt="" className="card-media" />
            <img src={img2} alt="" className="card-media" />
            <img src={img3} alt="" className="card-media" />
            <img src={img4} alt="" className="card-media" />
            <img src={img5} alt="" className="card-media" />
            <img src={img6} alt="" className="card-media" />
          </Orbit>
        )}
      </div>

      <button
        className="scroll-guide"
        type="button"
        onClick={() => {
          window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth',
          });
        }}
      >
        <span>SCROLL TO EXPLORE</span>
      </button>
    </main>
  );
}