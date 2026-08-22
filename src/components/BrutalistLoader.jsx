import React, { useState, useEffect } from "react";

export default function BrutalistLoader({ onComplete, debug = false }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Start our high-precision performance timestamp anchor
    const startTime = performance.now();
    console.log("[Loader] Engine initialized. Tracking network waterfall...");

    if (debug) {
      setProgress(65);
      return;
    }

    const targetExtensions = [".js", ".css", ".woff", ".woff2", ".png", ".jpg", ".jpeg", ".svg", ".mp4"];
    
    // Scan everything the browser waterfall has interacted with so far
    const initialResources = performance.getEntriesByType("resource");
    const criticalResources = initialResources.filter(res => 
      targetExtensions.some(ext => res.name.toLowerCase().includes(ext))
    );

    let loadedCount = 0;
    const totalAssets = criticalResources.length;

    // Helper to log exactly how long the loader stayed alive on screen
    const triggerExit = () => {
      const endTime = performance.now();
      const activeDurationMs = (endTime - startTime).toFixed(2);
      console.log(`[Loader] Closed. Total active duration on screen: ${activeDurationMs}ms`);
      if (onComplete) onComplete();
    };

    // Paced fallback tracker if assets loaded instantly before React booted up
    const runPacedFallback = () => {
      console.log("[Loader] Assets cached or loaded early. Running micro-paced layout sequence.");
      let currentFake = 0;
      const interval = setInterval(() => {
        currentFake += 1; // Increments smoothly by 5%
        setProgress(currentFake);
        
        if (currentFake >= 100) {
          clearInterval(interval);
          setTimeout(triggerExit, 150);
        }
      }, 20); // 20ms steps create a responsive, fluid transition
    };

    // If the browser already finished downloading everything before React caught up, run the paced transition
    if (totalAssets === 0 || criticalResources.every(res => res.duration > 0)) {
      runPacedFallback();
      return;
    }

    // Dynamic Tracking Logic for slower or streaming networks
    let fontsLoaded = false;
    document.fonts.ready.then(() => {
      fontsLoaded = true;
      checkGlobalReadiness();
    });

    const checkGlobalReadiness = () => {
      const resourcePercentage = totalAssets > 0 ? (loadedCount / totalAssets) * 100 : 100;
      const fontWeightage = fontsLoaded ? 100 : 0;
      const realOverallProgress = Math.floor((resourcePercentage + fontWeightage) / 2);
      
      setProgress(realOverallProgress);

      if (loadedCount >= totalAssets && fontsLoaded) {
        setTimeout(triggerExit, 150);
      }
    };

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (targetExtensions.some(ext => entry.name.toLowerCase().includes(ext))) {
          loadedCount++;
          checkGlobalReadiness();
        }
      });
    });

    try {
      observer.observe({ type: "resource", buffered: true });
    } catch (e) {
      runPacedFallback();
      return;
    }

    return () => {
      observer.disconnect();
    };
  }, [debug, onComplete]);

  return (
    <>
      <style>{`
        .brutalist-minimal-loader {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: #000000;
          z-index: 99999999;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          overflow: hidden;
        }
        .minimal-loader-wrapper {
          width: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .brutalist-thin-track {
          width: 100%;
          height: 8px;
          background-color: #222222;
          position: relative;
        }
        .brutalist-thin-fill {
          height: 100%;
          background-color: #ffffff;
          transition: width 0.05s linear;
          will-change: width;
        }
      `}</style>

      <div className="brutalist-minimal-loader">
        <div className="minimal-loader-wrapper">
          <div className="brutalist-thin-track">
            <div 
              className="brutalist-thin-fill" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>
    </>
  );
}
