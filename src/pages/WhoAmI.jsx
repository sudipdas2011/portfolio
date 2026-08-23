import { useEffect, useRef, useState } from 'react';
import TextRise from '../components/TextRise';

export default function WhoAmI() {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.8,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="who-section">
      {visible && (
        <div className="who-title">
          <TextRise
            text="who am i ?"
            className="hero-heading"
          />
        </div>
      )}
    </section>
  );
}