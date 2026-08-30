import { bayerGLSL } from "./dither.js";

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const streakFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uTexel;
  uniform vec2 uDirection;
  uniform float uSpread;
  varying vec2 vUv;

  void main() {
    vec2 stride = uDirection * uTexel * uSpread;
    vec4 sum = vec4(0.0);
    float total = 0.0;

    for (int i = -8; i <= 8; i++) {
      float fi = float(i);
      float w = exp(-fi * fi / 18.0);
      sum += texture2D(uMap, vUv + stride * fi) * w;
      total += w;
    }

    gl_FragColor = sum / total;
  }
`;

export const compositeFragment = /* glsl */ `
  uniform sampler2D uScene;
  uniform sampler2D uCardBuffer;
  uniform sampler2D uBlur1;
  uniform sampler2D uBlur2;
  uniform sampler2D uBlur3;
  uniform sampler2D uBlur4;

  uniform vec3  uBackground;
  uniform vec2  uResolution;
  uniform float uFocusSize;
  uniform float uEdgePower;
  uniform float uBlurStrength;
  uniform float uDitherScale;
  uniform float uMaxLevels;
  uniform float uMinLevels;
  uniform float uFadeStrength;
  uniform float uDitherAmount;
  uniform float uDitherStart;
  uniform float uDitherPower;
  uniform float uDitherDepth;
  uniform float uLift;
  uniform float uDepthBlur;

  uniform float uHoverBlur;
  uniform float uHoverBlurCurve;
  uniform float uHoverDither;
  uniform float uHoverDitherCurve;
  uniform float uHoverDitherLevels;
  uniform float uHoverDitherScale;
  uniform float uHoverDitherCutoff;
  uniform float uHoverClean;

  uniform float uCoupling;
  uniform float uStageStreakEnd;
  uniform float uStageDitherBegin;
  uniform float uStageHandoff;

  uniform vec3  uInk;
  uniform vec3  uAccent;
  uniform vec3  uPaper;
  uniform float uGamma;
  uniform float uMono;

  uniform vec3  uHoverInk;
  uniform vec3  uHoverAccent;
  uniform vec3  uHoverPaper;
  uniform float uHoverGamma;
  uniform float uHoverMono;

  uniform float uDissolve;

  uniform float uEntryDither;
  uniform float uEntryScale;
  uniform float uEntryLevels;
  uniform float uEntryDissolve;
  uniform vec3  uEntryInk;
  uniform vec3  uEntryAccent;
  uniform vec3  uEntryPaper;
  uniform float uEntryGamma;
  uniform float uEntryMono;

  uniform sampler2D uTrail;
  uniform float uTrailAmount;
  uniform float uTrailCutoff;
  uniform float uTrailWarp;
  uniform float uTrailAberration;
  uniform float uTrailContrast;
  uniform float uTrailScale;
  uniform float uTrailLevels;
  uniform float uTrailDissolve;
  uniform vec3  uTrailInk;
  uniform vec3  uTrailAccent;
  uniform vec3  uTrailPaper;
  uniform float uTrailGamma;
  uniform float uTrailMono;
  uniform float uTrailRim;
  uniform vec3  uTrailRimColor;
  uniform float uTrailRimThickness;
  uniform float uTrailRimSoftness;

  varying vec2 vUv;

  ${bayerGLSL}

  float luma(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
  }

  vec3 linearToSRGB(vec3 c) {
    return mix(
      c * 12.92,
      1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
      step(vec3(0.0031308), c)
    );
  }

  vec3 composed(vec2 uv, float lvl) {
    vec3 c = texture2D(uScene, uv).rgb;
    c = mix(c, texture2D(uBlur1, uv).rgb, clamp(lvl - 0.0, 0.0, 1.0));
    c = mix(c, texture2D(uBlur2, uv).rgb, clamp(lvl - 1.0, 0.0, 1.0));
    c = mix(c, texture2D(uBlur3, uv).rgb, clamp(lvl - 2.0, 0.0, 1.0));
    c = mix(c, texture2D(uBlur4, uv).rgb, clamp(lvl - 3.0, 0.0, 1.0));
    return c;
  }

  vec3 toDisplay(vec3 c, float fade) {
    c = linearToSRGB(c);
    c = mix(c, uBackground, fade);
    return mix(c, uBackground, uLift);
  }

  vec2 cellUv(float cell, vec2 offset) {
    return (floor(gl_FragCoord.xy / cell) + 0.5) * cell / uResolution + offset;
  }

  vec3 grade(vec3 c, float amount) {
    return clamp((c - 0.5) * (1.0 + uTrailContrast * amount) + 0.5, 0.0, 1.0);
  }

  struct Palette {
    vec3 ink;
    vec3 accent;
    vec3 paper;
    float gamma;
    float mono;
  };

  vec3 ramp(Palette p, float t) {
    return t < 0.5
      ? mix(p.ink, p.accent, t * 2.0)
      : mix(p.accent, p.paper, (t - 0.5) * 2.0);
  }

  vec3 poster(Palette p, vec3 c, float threshold, float levels) {
    float steps = max(levels - 1.0, 1.0);
    float tone = pow(clamp(luma(c), 0.0, 1.0), p.gamma);
    vec3 toned = ramp(p, floor(tone * steps + threshold) / steps);
    vec3 quantized = floor(c * steps + threshold) / steps;
    return mix(quantized, toned, p.mono);
  }

  float ditherMask(float drive, float threshold, float dissolve) {
    return mix(drive, drive > threshold ? 1.0 : 0.0, dissolve);
  }

  void main() {
    float d = abs(vUv.y - 0.5) * 2.0;
    float edge = smoothstep(uFocusSize, 1.0, d);
    edge = pow(edge, uEdgePower);

    vec4 scene = texture2D(uScene, vUv);
    vec4 card = texture2D(uCardBuffer, vUv);
    float dim = pow(card.g, uHoverBlurCurve);

    float entry = 1.0 - card.a;

    float clean = card.b * uHoverClean;
    float keep = 1.0 - clean;

    float distance = 1.0 - scene.a;
    float dissolve = max(edge, distance * uDepthBlur);

    float recession = max(d, distance * uDitherDepth);
    float ditherLoose = pow(smoothstep(uDitherStart, 1.0, recession), uDitherPower);

    float ditherTight =
      pow(smoothstep(uStageDitherBegin, 1.0, dissolve), uDitherPower);
    float streakTight = smoothstep(0.0, uStageStreakEnd, dissolve);
    streakTight *= 1.0 - ditherTight * uStageHandoff;

    float blurDrive = mix(dissolve, streakTight, uCoupling);
    float ditherDrive = mix(ditherLoose, ditherTight, uCoupling);

    float softness = max(blurDrive, dim * uHoverBlur);
    softness *= keep;

    float lvl = softness * uBlurStrength * 4.0;
    float fade = edge * uFadeStrength * keep;

    vec4 trail = texture2D(uTrail, vUv);
    float trailMask = clamp(trail.r, 0.0, 1.0);
    vec2 trailVelocity = trail.gb;

    vec2 push = trailVelocity * uTrailWarp * trailMask;
    vec2 shift = trailVelocity * uTrailAberration * trailMask;

    vec3 base = composed(vUv + push * 0.5, lvl);

    if (uTrailAberration > 0.0) {
      base.r = composed(vUv + push * 0.5 + shift * 0.35, lvl).r;
      base.b = composed(vUv + push * 0.5 - shift * 0.35, lvl).b;
    }

    vec3 c = toDisplay(base, fade);

    float edgeLevels = max(mix(uMaxLevels, uMinLevels, ditherDrive), 2.0);
    float edgeThreshold = bayer8(gl_FragCoord.xy / uDitherScale);
    
    vec3 edgeSource = uDitherScale > 1.0
      ? toDisplay(composed(cellUv(uDitherScale, push), lvl), fade)
      : c;

    Palette edgePalette = Palette(uInk, uAccent, uPaper, uGamma, uMono);

    vec3 result = mix(
      c,
      poster(edgePalette, edgeSource, edgeThreshold, edgeLevels),
      ditherMask(uDitherAmount * ditherDrive * keep, edgeThreshold, uDissolve)
    );

    float hoverRamp = pow(card.g, uHoverDitherCurve);

    hoverRamp = smoothstep(uHoverDitherCutoff, 1.0, hoverRamp) * uHoverDither;

    float hoverLevels = max(uHoverDitherLevels, 2.0);
    float hoverThreshold = bayer8(gl_FragCoord.xy / uHoverDitherScale);
    vec3 hoverSource = uHoverDitherScale > 1.0
      ? toDisplay(composed(cellUv(uHoverDitherScale, push), lvl), fade)
      : c;

    Palette hoverPalette =
      Palette(uHoverInk, uHoverAccent, uHoverPaper, uHoverGamma, uHoverMono);

    result = mix(
      result,
      poster(hoverPalette, hoverSource, hoverThreshold, hoverLevels),
      ditherMask(hoverRamp, hoverThreshold, uDissolve)
    );

    float trailThreshold = bayer8(gl_FragCoord.xy / uTrailScale);
    float trailShaped = smoothstep(uTrailCutoff, 0.8, trailMask) * uTrailAmount;

    vec3 trailSource = uTrailScale > 1.0
      ? toDisplay(composed(cellUv(uTrailScale, push), lvl), fade)
      : c;
    trailSource = grade(trailSource, trailMask);

    Palette trailPalette =
      Palette(uTrailInk, uTrailAccent, uTrailPaper, uTrailGamma, uTrailMono);

    result = mix(
      result,
      poster(trailPalette, trailSource, trailThreshold, max(uTrailLevels, 2.0)),
      ditherMask(trailShaped, trailThreshold, uTrailDissolve)
    );

    float rimDist = abs(trailShaped - 0.5) * 2.0;
    float rimSoft = max(uTrailRimSoftness, 0.001);
    float rim = 1.0 -
      smoothstep(uTrailRimThickness - rimSoft, uTrailRimThickness + rimSoft, rimDist);
    result = mix(result, uTrailRimColor, rim * uTrailRim);

    float entryThreshold = bayer8(gl_FragCoord.xy / uEntryScale);
    vec3 entrySource = uEntryScale > 1.0
      ? toDisplay(composed(cellUv(uEntryScale, push), lvl), fade)
      : c;

    Palette entryPalette =
      Palette(uEntryInk, uEntryAccent, uEntryPaper, uEntryGamma, uEntryMono);

    result = mix(
      result,
      poster(entryPalette, entrySource, entryThreshold, max(uEntryLevels, 2.0)),
      ditherMask(entry * uEntryDither, entryThreshold, uEntryDissolve)
    );

    gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
  }
`;