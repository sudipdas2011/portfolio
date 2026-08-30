import * as THREE from "three";
import { cardVertex } from "./shaders/card.js";
import { bayerGLSL, revealGLSL } from "./shaders/dither.js";

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
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.UnsignedByteType,
  });
  target.texture.generateMipmaps = false;

  cards.forEach((card, index) => {
    card.userData.bufferMaterial = new THREE.ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardBufferFragment,
      uniforms: {
        ...card.material.uniforms,
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
