import { useState, useEffect, useRef } from 'react';

export default function useAssetLoader(assets = [], componentName = "App") {
  const [percent, setPercent] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const loaderFinishedIntro = useRef(false);
  const [showLoader, setShowLoader] = useState(true);

  const logProgress = (currentPercent) => {
    const totalBars = 10;
    const filledBars = Math.round((currentPercent / 100) * totalBars);
    const emptyBars = totalBars - filledBars;

    const hashStr = '#'.repeat(filledBars);
    const underscoreStr = '_'.repeat(emptyBars);

    console.log(`[${componentName}] loading: ${hashStr}${underscoreStr} [${currentPercent}%]`);
  };

  useEffect(() => {
    if (assets.length === 0) {
      setPercent(100);
      setAssetsReady(true);
      logProgress(100);
      return;
    }

    let loadedCount = 0;
    logProgress(0);

    assets.forEach((src) => {
      const img = new Image();
      img.src = src;

      const handleAssetLoad = () => {
        loadedCount++;
        const currentPercent = Math.round((loadedCount / assets.length) * 100);

        setPercent(currentPercent);
        logProgress(currentPercent);

        if (loadedCount === assets.length) {
          setAssetsReady(true);
          if (loaderFinishedIntro.current) {
            setShowLoader(false);
          }
        }
      };

      img.onload = handleAssetLoad;
      img.onerror = handleAssetLoad;
    });
  }, [assets, componentName]);

  const handleLoaderComplete = () => {
    loaderFinishedIntro.current = true;
    if (assetsReady) {
      setShowLoader(false);
    }
  };

  return {
    showLoader,
    percent,
    handleLoaderComplete
  };
}