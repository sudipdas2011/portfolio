import React from "react";

export default function Marquee({
  text = "SCROLL //",
  height = "60px",
  speed = 15,
  hoverSpeed = 8,
  fontFamily = "sans-serif",
  fontSize = "1.5rem",
  fontWeight = "900",
  letterSpacing = "2px",
  textTransform = "uppercase",
  textColor = "#fff",
  bgColor = "#000",
  borderColor = "#fff",
  hoverTextColor = "#000",
  hoverBgColor = "#fff",
  hoverBorderColor = "#fff",
  onPress = () => {},
}) {
  const duration = Math.max(Math.abs(speed), 0.1);
  const hoverDuration = Math.max(Math.abs(hoverSpeed), 0.1);
  const reverse = speed > 0;

  return (
    <div
      className="marquee"
      onClick={onPress}
      style={{
        "--marquee-h": height,
        "--marquee-speed": `${duration}s`,
        "--marquee-hover-speed": `${hoverDuration}s`,
        "--marquee-font": fontFamily,
        "--marquee-size": fontSize,
        "--marquee-weight": fontWeight,
        "--marquee-spacing": letterSpacing,
        "--marquee-color": textColor,
        "--marquee-bg": bgColor,
        "--marquee-border": borderColor,
        "--marquee-hover-color": hoverTextColor,
        "--marquee-hover-bg": hoverBgColor,
        "--marquee-hover-border": hoverBorderColor,
      }}
    >
      <div
        className={`marquee-track ${reverse ? "reverse" : ""}`}
      >
        <span>{text}</span>
        <span aria-hidden="true">{text}</span>
      </div>
    </div>
  );
}