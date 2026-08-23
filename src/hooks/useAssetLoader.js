import { useEffect, useRef, useState } from 'react';

export default function useAssetLoader(assets = []) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [show, setShow] = useState(true);

  const introDone = useRef(false);

  useEffect(() => {
    if (!assets.length) {
      setProgress(100);
      setReady(true);

      if (introDone.current) {
        setShow(false);
      }

      return;
    }

    let loaded = 0;

    const load = () => {
      loaded += 1;

      const progress = Math.round(
        (loaded / assets.length) * 100
      );

      setProgress(progress);

      if (loaded === assets.length) {
        setReady(true);

        if (introDone.current) {
          setShow(false);
        }
      }
    };

    assets.forEach((src) => {
      const img = new Image();

      img.onload = load;
      img.onerror = load;
      img.src = src;
    });
  }, [assets]);

  const complete = () => {
    introDone.current = true;

    if (ready) {
      setShow(false);
    }
  };

  return {
    showLoader: show,
    percent: progress,
    handleLoaderComplete: complete,
  };
}