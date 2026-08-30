export const trailFragment = /* glsl */ `
  varying vec2 vUv;

  uniform sampler2D uPrev;
  uniform vec2  uMouse;
  uniform vec2  uPrevMouse;
  uniform vec2  uVelocity;
  uniform vec2  uTexel;
  uniform vec2  uSize;
  uniform float uRadius;
  uniform float uDecay;
  uniform float uDissipate;
  uniform float uActive;

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 o = uTexel * uDissipate;
    vec4 prev = texture2D(uPrev, vUv) * 0.6;
    prev += texture2D(uPrev, vUv + vec2(o.x, 0.0)) * 0.1;
    prev += texture2D(uPrev, vUv - vec2(o.x, 0.0)) * 0.1;
    prev += texture2D(uPrev, vUv + vec2(0.0, o.y)) * 0.1;
    prev += texture2D(uPrev, vUv - vec2(0.0, o.y)) * 0.1;

    float d = sdSegment(vUv * uSize, uPrevMouse * uSize, uMouse * uSize);

    float brush = 1.0 - smoothstep(uRadius * 0.25, uRadius, d);
    brush = pow(brush, 1.6) * uActive;

    float intensity = max(prev.r * uDecay, brush);
    vec2 velocity = mix(prev.gb * uDecay, uVelocity, brush);

    gl_FragColor = vec4(intensity, velocity, 1.0);
  }
`;
