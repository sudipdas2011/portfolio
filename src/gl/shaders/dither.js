export const bayerGLSL = /* glsl */ `
  float bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2.0 + a.y * a.y * 0.75);
  }
  #define bayer4(a) (bayer2(0.5 * (a)) * 0.25 + bayer2(a))
  #define bayer8(a) (bayer4(0.5 * (a)) * 0.25 + bayer2(a))
`;

export const revealGLSL = /* glsl */ `
  uniform float uEntry;
  uniform float uEntryScale;
  uniform float uEntrySoftness;
  uniform float uEntryAspect;

  bool entryHidden(vec2 uv) {
    if (uEntry <= 0.0) return false;
    vec2 offset = (uv - 0.5) * vec2(uEntryAspect, 1.0);
    float d = length(offset) / length(vec2(uEntryAspect, 1.0) * 0.5);
    float soft = max(uEntrySoftness, 0.001);
    float front = (1.0 - uEntry) * (1.0 + soft);
    float t = (front - d) / soft;

    return t <= bayer8(gl_FragCoord.xy / uEntryScale);
  }
`;
