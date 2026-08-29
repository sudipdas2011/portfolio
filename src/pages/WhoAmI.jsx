import { useEffect, useRef, useState } from 'react';
import TextRise from '../components/TextRise';
import HeadModel from '../components/HeadModel';

export default function WhoAmI() {
  const [visible, setVisible] = useState(false);
  const [textStage, setTextStage] = useState('idle'); 
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTextStage('rise');
          observer.disconnect();
        }
      },
      {
        threshold: 0.85,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (textStage === 'rise') {
      const timer = setTimeout(() => {
        setTextStage('exit');
      }, 2000); 
      return () => clearTimeout(timer);
    }
    
    if (textStage === 'exit') {
      const timer = setTimeout(() => {
        setTextStage('done');
      }, 600); 
      return () => clearTimeout(timer);
    }
  }, [textStage]);

  return (
    <section ref={ref} className="who-section full-backdrop-layout">
      {visible && (
        <>
         
          {textStage === 'done' && (
            <div className="who-bg-canvas-layer content-fade-in">
              <HeadModel />
            </div>
          )}

          {textStage !== 'done' && (
            <div className={`who-fg-content-overlay text-stage-${textStage}`}>
              <div style={{transform: `scale(${(window.innerWidth * 0.0004).toFixed(2)})`}}>
                <TextRise
                  text="who am i ?"
                  className="hero-heading"
                />
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
