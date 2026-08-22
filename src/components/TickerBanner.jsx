import React from "react";

export default function TickerBanner({
  text = "SCROLL // ",
  height = "60px",
  speed = 15,            // Positive value = moves right cleanly
  hoverSpeed = 8,        // Speed when hovered
  fontFamily = "sans-serif",
  fontSize = "1.5rem",
  fontWeight = "900",
  letterSpacing = "2px",
  textTransform = "uppercase",
  
  normalTextColor = "#ffffff",
  normalBgColor = "#000000",
  normalBorderColor = "#ffffff",
  
  hoverTextColor = "#000000",
  hoverBgColor = "#ffffff",
  hoverBorderColor = "#ffffff",
  
  onPress = () => {}
}) {
  // Multiply the string to create a dense, unbroken infinite stream
  const repeatedText = `${text}`.repeat(16);
  
  const isRightDirection = speed > 0;
  const absSpeed = Math.abs(speed);
  const absHoverSpeed = Math.abs(hoverSpeed);

  // Turn strings into separate array items to allow independent letter masking
  const lettersArray = repeatedText.split("");

  return (
    <>
      <style>{`
        /* --- HIGH PERFORMANCE INFINITE LOOPS --- */
        @keyframes ticker-move-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        @keyframes ticker-move-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }

        .ticker-root-shell {
          position: relative;
          width: 100vw;
          height: ${height};
          background-color: ${normalBgColor};
          border-top: 3px solid ${normalBorderColor};
          border-bottom: 3px solid ${normalBorderColor};
          overflow: hidden;
          cursor: pointer !important;
          box-sizing: border-box;
          transition: background-color 0.6s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Continuous moving ribbon track line */
        .ticker-ribbon-track {
          display: flex;
          width: max-content;
          height: 100%;
          align-items: center;
          will-change: transform;
          animation: ${isRightDirection ? "ticker-move-right" : "ticker-move-left"} ${absSpeed}s linear infinite;
        }

        /* Accelerate animation speeds seamlessly upon parent hover hooks */
        .ticker-root-shell:hover .ticker-ribbon-track {
          animation-duration: ${absHoverSpeed}s;
        }

        /* Modify root background blocks instantly on layout hover state changes */
        .ticker-root-shell:hover {
          background-color: ${hoverBgColor};
          border-color: ${hoverBorderColor};
        }

        /* Individual text letter nodes architecture layout */
        .ticker-letter-node {
          display: inline-block;
          font-family: ${fontFamily};
          font-size: ${fontSize};
          font-weight: ${fontWeight};
          letter-spacing: ${letterSpacing};
          text-transform: ${textTransform};
          color: ${normalTextColor};
          white-space: pre;
          
          /* Organic ripple curve setup */
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
                      color 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* 
          THE ARTISTIC RIPPLE EFFECT:
          When hovering over the banner, individual text letters pull upwards, 
          spin slightly out of line, and swap colors in a mechanical waveline.
        */
        .ticker-root-shell:hover .ticker-letter-node {
          color: ${hoverTextColor};
          transform: translate3d(0, -4px, 0);
        }
      `}</style>

      <div className="ticker-root-shell" onClick={onPress} cursor-select="true">
        {/* Render Track Block 1 */}
        <div className="ticker-ribbon-track">
          {lettersArray.map((char, index) => (
            <span
              key={`track1-${index}`}
              className="ticker-letter-node"
              style={{
                /* Staggered mathematical timing logic applies micro delays to the letters index */
                transitionDelay: `${(index % 40) * 0.012}s`,
              }}
            >
              {char}
            </span>
          ))}
          {/* Render Track Block 2 to stitch a perfect, unbreaking loop gap */}
          {lettersArray.map((char, index) => (
            <span
              key={`track2-${index}`}
              className="ticker-letter-node"
              style={{
                transitionDelay: `${(index % 40) * 0.012}s`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
