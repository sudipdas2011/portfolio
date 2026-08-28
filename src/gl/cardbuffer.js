import * as THREE from "three";
import { cardVertex } from "./shaders/card.js";
import { bayerGLSL, revealGLSL } from "./shaders/dither.js";

// An auxiliary pass carrying four per-card facts the rest of the pipeline
// can't work out on its own:
//
//   R = card id      → which card is under the cursor
//   G = dim amount   → how far this card has receded for rack focus
//   B = hover amount → lets the composite exempt the hovered card from the
//                      frame-edge treatment
//   A = arrived      → how far through the entry this card is, 1 once it's in
//
// All of it needs each card's real on-screen shape, and cards are shaped
// entirely in the vertex shader — the CPU-side geometry is just a flat plane at
// the origin. So this reuses cardVertex as-is and inherits the helix slot,
// cylinder curve, shingle offset and motion bend for free. Raycasting would
// test the flat plane and be wrong everywhere.
//
// The green channel is what lets hover own separate blur and dither settings.
// Without it the composite sees one recession value and can't tell a dimmed
// card from one that's genuinely far away.

// Entry is stored inverted, as arrived-ness, because the target clears to alpha
// 1 — so empty background reads as long since arrived and the composite leaves
// it alone, the same trick the scene pass plays with depth.
//
// The reveal is applied here as well as in the visible pass. It has to be: this
// is what hit testing reads, and a card that can be clicked before it appears
// is worse than one that can't be clicked once it has.
const cardBufferFragment = /* glsl */ `
  uniform float uPickId;
  uniform float uDim;
  uniform float uHover;

  varying vec2 vUv;

  ${bayerGLSL}
  ${revealGLSL}

  void main() {
    if (entryHidden(vUv)) discard;
    gl_FragColor = vec4(uPickId, uDim, uHover, 1.0 - uEntry);
  }
`;

export function createCardBuffer(renderer, scene, cards, config) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    // Linear gives the composite a soft edge on the dim mask. Id readback goes
    // through readRenderTargetPixels, which reads raw texels and ignores the
    // filter, so ids stay exact either way.
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    // Has to stay 8-bit unsigned — ids come back out of the red channel as
    // integers and a half-float target wouldn't round-trip them.
    type: THREE.UnsignedByteType,
  });
  target.texture.generateMipmaps = false;

  cards.forEach((card, index) => {
    card.userData.bufferMaterial = new THREE.ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardBufferFragment,
      // Spreading copies references to the same uniform objects the visible
      // material holds, so this deforms identically and picks up uDim without a
      // second update path to keep in sync.
      uniforms: {
        ...card.material.uniforms,
        // Id 0 is reserved for "nothing here", so cards start at 1.
        uPickId: { value: (index + 1) / 255 },
      },
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
    });
  });

  const pixel = new Uint8Array(4);

  function setSize(width, height) {
    target.setSize(
      Math.max(1, Math.floor(width * config.cardBufferScale)),
      Math.max(1, Math.floor(height * config.cardBufferScale))
    );
  }

  function render(camera) {
    // scene.background would clear this to the background colour, which then
    // reads back as a card id and as full dim. Drop it for a black clear.
    const background = scene.background;
    scene.background = null;

    for (const card of cards) {
      card.userData.visibleMaterial = card.material;
      card.material = card.userData.bufferMaterial;
    }

    renderer.setRenderTarget(target);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    for (const card of cards) card.material = card.userData.visibleMaterial;
    scene.background = background;
  }

  // x, y normalized 0..1 with y from the bottom, matching GL. Must be called
  // after render() for the current frame.
  function pick(x, y) {
    const px = Math.min(target.width - 1, Math.max(0, Math.floor(x * target.width)));
    const py = Math.min(target.height - 1, Math.max(0, Math.floor(y * target.height)));
    renderer.readRenderTargetPixels(target, px, py, 1, 1, pixel);
    return pixel[0] === 0 ? -1 : pixel[0] - 1;
  }

  function dispose() {
    target.dispose();
    cards.forEach((card) => card.userData.bufferMaterial?.dispose());
  }

  return { setSize, render, pick, dispose, texture: target.texture };
}
