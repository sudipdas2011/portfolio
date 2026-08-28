import { useRef, useEffect } from "react";

export default function ProxText({ text, className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const chars = containerRef.current?.querySelectorAll(".prox-char");
    if (!chars) return;

    const handleMouseMove = (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      chars.forEach((char) => {
        const rect = char.getBoundingClientRect();
        const charX = rect.left + rect.width / 2;
        const charY = rect.top + rect.height / 2;

        const distance = Math.sqrt(Math.pow(mouseX - charX, 2) + Math.pow(mouseY - charY, 2));
        const maxDist = 350;

        if (distance < maxDist) {
          const power = (maxDist - distance) / maxDist;
          const scaleY = 1 + power * 0.4;
          const letterSpacing = -0.06 - (power * 0.04);
          
          char.style.transform = `scaleY(${scaleY})`;
          char.style.letterSpacing = `${letterSpacing}em`;
        } else {
          char.style.transform = "scaleY(1)";
          char.style.letterSpacing = "-0.06em";
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className={`prox-stretch-row ${className}`}>
      {text.split("").map((char, index) => (
        <span
          key={index}
          className="prox-char"
          cursor-select="true"
          style={{
            display: "inline-block",
            willChange: "transform, letter-spacing",
            transition: "transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), letter-spacing 0.1s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
