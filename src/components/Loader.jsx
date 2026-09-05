import { useEffect, useState } from 'react';

export default function Loader({
  assets = [],
  onComplete,
  debug = false,
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (debug) {
      setProgress(65);
      return;
    }

    let cancelled = false;
    let completed = 0;

    const total = assets.length;

    if (total === 0) {
      setProgress(100);
      onComplete?.();
      return;
    }

    const updateProgress = () => {
      if (cancelled) return;

      completed += 1;

      const percent = Math.round(
        (completed / total) * 100
      );

      setProgress(percent);
    };

    const loadImage = (src) =>
      new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          updateProgress();
          resolve();
        };

        img.onerror = () => {
          console.warn('Failed to preload:', src);
          updateProgress();
          resolve();
        };

        img.src = src;
      });

    const loadFont = (src) =>
      new Promise((resolve) => {
        const font = new FontFace(
          `LoaderFont-${Math.random()}`,
          `url("${src}")`
        );

        font.load()
          .then((loadedFont) => {
            document.fonts.add(loadedFont);
          })
          .catch(() => {
            console.warn('Failed to preload font:', src);
          })
          .finally(() => {
            updateProgress();
            resolve();
          });
      });

    const loadBinary = (src) =>
      fetch(src, {
        cache: 'reload',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed: ${src}`);
          }

          return response.arrayBuffer();
        })
        .catch(() => {
          console.warn('Failed to preload:', src);
        })
        .finally(() => {
          updateProgress();
        });

    const loadAsset = (src) => {
      const lower = src.toLowerCase();

      // Images
      if (
        lower.endsWith('.png') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.svg')
      ) {
        return loadImage(src);
      }

      // Fonts
      if (
        lower.endsWith('.woff') ||
        lower.endsWith('.woff2') ||
        lower.endsWith('.otf') ||
        lower.endsWith('.ttf')
      ) {
        return loadFont(src);
      }

      // GLB / GLTF / HDR / other files
      return loadBinary(src);
    };

    const preloadEverything = async () => {
     
      await Promise.all(
        assets.map((asset) => loadAsset(asset))
      );

      if (cancelled) return;

      await document.fonts.ready;

      if (cancelled) return;

      setProgress(100);
      requestAnimationFrame(() => {
        if (cancelled) return;

        setTimeout(() => {
          if (!cancelled) {
            onComplete?.();
          }
        }, 200);
      });
    };

    preloadEverything();

    return () => {
      cancelled = true;
    };
  }, [assets, debug, onComplete]);

  return (
    <div className="loader">
      <div className="loader-inner">
        <div className="loader-track">
          <div
            className="loader-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}