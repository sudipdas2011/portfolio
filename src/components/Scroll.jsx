import { useEffect, useState } from 'react';

export default function Scroll() {
  const [scrollProgress, setScrollProgress] = useState(0);

  // 5 sections: Hero, Who Am I, What I Do, Carousel, Contact
  const sections = 5;

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollTop = window.scrollY;
      const progress = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="scroll-indicator">
      <div className="scroll-line">
        {Array.from({ length: sections }).map((_, index) => (
          <div
            key={index}
            className="scroll-square"
            style={{
              top: `${(index / sections) * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}