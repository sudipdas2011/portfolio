import { bayerGLSL, revealGLSL } from "./dither.js";

export const cardVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uIndex;
  uniform float uCount;
  uniform float uRadius;
  uniform float uPitch;
  uniform float uAngleStep;
  uniform float uCurve;
  uniform float uShingle;
  uniform float uVelocity;
  uniform float uBend;
  uniform float uBendVertical;
  uniform float uBendHorizontal;
  uniform float uHover;

  varying vec2 vUv;
  varying float vFacing;
  varying float vSlot;
  varying float vDepth;

  void main() {
    vUv = uv;

    float slot = mod(uIndex - uProgress, uCount);
    vSlot = slot / uCount;

    float baseAngle = (slot - uCount * 0.5) * uAngleStep;
    float baseY     = (slot - uCount * 0.5) * uPitch;

    float tx = (uv.x - 0.5) * 2.0;
    float ty = (uv.y - 0.5) * 2.0;

    float lagV = uVelocity * uBend * tx * tx * uBendVertical;
    baseAngle += lagV * uAngleStep * 0.35;
    baseY     += lagV * uPitch;

    float lagH = uVelocity * uBend * ty * ty * uBendHorizontal;
    baseAngle += lagH * uAngleStep * 0.5;

    float r = uRadius + slot * uShingle;

    float theta = baseAngle + (position.x / r) * uCurve;

    vec3 curved = vec3(sin(theta) * r, 0.0, cos(theta) * r);
    vec3 flat_ = vec3(
      sin(baseAngle) * r + cos(baseAngle) * position.x,
      0.0,
      cos(baseAngle) * r - sin(baseAngle) * position.x
    );

    vec3 p = mix(flat_, curved, uCurve);
    p.y = position.y + baseY;

    vFacing = cos(baseAngle) * 0.5 + 0.5;

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    vDepth = -viewPosition.z;

    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const cardFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uImageRatio;
  uniform float uBackfaceFade;
  uniform vec3 uBackground;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogStrength;
  uniform float uHover;
  uniform float uDim;
  uniform float uDimFade;

  varying vec2 vUv;
  varying float vFacing;
  varying float vDepth;

  ${bayerGLSL}
  ${revealGLSL}

  void main() {
    if (entryHidden(vUv)) discard;

    vec2 uv = (vUv - 0.5) * uImageRatio + 0.5;
    vec4 tex = texture2D(uMap, uv);

    float fade = mix(1.0, smoothstep(0.0, 0.55, vFacing), uBackfaceFade * (1.0 - uHover));

    vec3 color = mix(uBackground, tex.rgb, tex.a * fade);

    float fog = smoothstep(uFogNear, uFogFar, vDepth) * (1.0 - uHover);
    color = mix(color, uBackground, fog * uFogStrength);

    float dimAmount = 1.0 - pow(1.0 - uDim * uDimFade, 2.2);
    color = mix(color, uBackground, dimAmount);

    gl_FragColor = vec4(color, 1.0 - fog);
  }
`;
