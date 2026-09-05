import { useEffect, useState } from 'react';

export default function Loader({ onComplete, debug = false }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (debug) {
      setProgress(65);
      return;
    }

    const types = [
      '.js',
      '.css',
      '.woff',
      '.woff2',
      '.png',
      '.jpg',
      '.jpeg',
      '.svg',
      '.mp4',
      '.png',
      '.webp',
      '.glb',
      '.hdr',
    ];

    const resources = performance.getEntriesByType('resource');
    const assets = resources.filter((item) =>
      types.some((type) => item.name.toLowerCase().includes(type))
    );

    let loaded = 0;
    let timer;

    const done = () => {
      clearTimeout(timer);
      setTimeout(() => {
        onComplete?.();
      }, 750 * 5);
    };

    const fallback = () => {
      let value = 0;

      const interval = setInterval(() => {
        value += 1;
        setProgress(value);

        if (value >= 100) {
          clearInterval(interval);
          timer = setTimeout(done, 150);
        }
      }, 20);

      return interval;
    };

    if (!assets.length || assets.every((item) => item.duration > 0)) {
      const interval = fallback();

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    let fonts = false;

    const check = () => {
      const resourceProgress =
        assets.length > 0 ? (loaded / assets.length) * 100 : 100;

      const percent = Math.floor(
        (resourceProgress + (fonts ? 100 : 0)) / 2
      );

      setProgress(percent);

      if (loaded >= assets.length && fonts) {
        timer = setTimeout(done, 150);
      }
    };

    document.fonts.ready.then(() => {
      fonts = true;
      check();
    });

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (types.some((type) => entry.name.toLowerCase().includes(type))) {
          loaded += 1;
          check();
        }
      });
    });

    try {
      observer.observe({
        type: 'resource',
        buffered: true,
      });
    } catch {
      const interval = fallback();

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [debug, onComplete]);

  return (
    <div className="loader">
      <div className="loader-inner">
        <div className="loader-track">
          <div
            className="loader-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}