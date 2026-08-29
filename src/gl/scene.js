import * as THREE from "three";
import { config, IMAGES } from "./config.js";
import { cardVertex, cardFragment } from "./shaders/card.js";
import { createScrollController } from "./scroll.js";
import { createPostPipeline } from "./post.js";
import { createCardBuffer } from "./cardbuffer.js";
import { createTrail } from "./trail.js";
import { createGui } from "./gui.js";
import { hexToSRGB } from "./color.js";

const ENTRY_WAIT_LIMIT = 5000;

const BEND_WEIGHTS = {
  vertical: [1, 0],
  horizontal: [0, 1],
  both: [0.7, 0.7],
};

function approach(current, target, config) {
  const rate = target > current ? config.hoverInEase : config.hoverOutEase;
  return current + (target - current) * rate;
}

function entryAspect() {
  const aspect = config.cardWidth / config.cardHeight;
  return 1 + (aspect - 1) * config.entryRound;
}

function smoothstep(edge0, edge1, x) {
  if (edge1 <= edge0) return x <= edge0 ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export function createCarousel(canvas, { onActiveChange } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(config.fov, 1, 0.1, 100);
  camera.position.z = config.cameraZ;

  const backgroundLinear = new THREE.Color(config.background);
  const backgroundSRGB = hexToSRGB(config.background);
  scene.background = backgroundLinear;

  const post = createPostPipeline(renderer, config, backgroundSRGB);
  const scroll = createScrollController(canvas, config);
  const trail = createTrail(renderer, canvas, config);

  const loader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  let geometry = buildGeometry();
  const cards = [];

  function buildGeometry() {
    return new THREE.PlaneGeometry(config.cardWidth, config.cardHeight, 48, 24);
  }

  function coverRatio(texture) {
    const cardAspect = config.cardWidth / config.cardHeight;
    const image = texture.image;
    const imageAspect = image.width / image.height;
    return new THREE.Vector2(
      Math.min(1, cardAspect / imageAspect),
      Math.min(1, imageAspect / cardAspect)
    );
  }

  IMAGES.forEach((src, index) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      uniforms: {
        uMap: { value: null },
        uImageRatio: { value: new THREE.Vector2(1, 1) },
        uBackground: { value: backgroundLinear },
        uBackfaceFade: { value: config.backfaceFade },
        uFogNear: { value: config.fogNear },
        uFogFar: { value: config.fogFar },
        uFogStrength: { value: config.fogStrength },
        uProgress: { value: 0 },
        uIndex: { value: index },
        uCount: { value: IMAGES.length },
        uRadius: { value: config.radius },
        uPitch: { value: config.pitch },
        uAngleStep: { value: config.angleStep },
        uCurve: { value: config.curve },
        uShingle: { value: config.shingle },
        uVelocity: { value: 0 },
        uBend: { value: config.bend },
        uBendVertical: { value: 1 },
        uBendHorizontal: { value: 0 },
        uHover: { value: 0 },
        uDim: { value: 0 },
        uDimFade: { value: config.dimFade },
        uEntry: { value: 1 },
        uEntryScale: { value: config.entryScale },
        uEntrySoftness: { value: config.entrySoftness },
        uEntryAspect: { value: entryAspect() },
      },
      side: THREE.DoubleSide,
      blending: THREE.NoBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.hoverRaw = { hover: 0, dim: 0 };
    mesh.userData.entry = 1;
    mesh.userData.entryOrder = index;
    mesh.frustumCulled = false;
    scene.add(mesh);
    cards.push(mesh);

    loader.load(
      src,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = maxAnisotropy;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        material.uniforms.uMap.value = texture;
        material.uniforms.uImageRatio.value.copy(coverRatio(texture));
        textureSettled();
      },
      undefined,
      textureSettled
    );
  });

  function rebuildGeometry() {
    const next = buildGeometry();
    cards.forEach((card) => {
      card.geometry = next;
      const texture = card.material.uniforms.uMap.value;
      if (texture) card.material.uniforms.uImageRatio.value.copy(coverRatio(texture));
    });
    geometry.dispose();
    geometry = next;
  }

  const cardBuffer = createCardBuffer(renderer, scene, cards, config);
  post.compositeMaterial.uniforms.uCardBuffer.value = cardBuffer.texture;

  let pending = IMAGES.length;
  let entryStart = null;

  function shuffleEntryOrder() {
    const order = cards.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    cards.forEach((card, index) => (card.userData.entryOrder = order[index]));
  }

  function parkForEntry() {
    scroll.state.current = -config.entrySpin;
    scroll.state.target = scroll.state.current;
    shuffleEntryOrder();
    for (const card of cards) {
      card.userData.entry = 1;
      card.material.uniforms.uEntry.value = 1;
    }
  }

  function beginEntry() {
    if (!config.entry) return;
    parkForEntry();
    scroll.goTo(0, {
      duration: config.entrySpinDuration,
      easeIn: config.entryEaseIn,
      easeOut: config.entryEaseOut,
    });
    entryStart = performance.now();
  }

  const entryWait = setTimeout(() => {
    pending = 0;
    beginEntry();
  }, ENTRY_WAIT_LIMIT);

  function textureSettled() {
    if (pending === 0 || --pending > 0) return;
    clearTimeout(entryWait);
    beginEntry();
  }

  if (config.entry) parkForEntry();

  const pointer = { x: 0, y: 0, inside: false };
  let hovered = -1;

  let travel = 0;
  let pointerSpeed = 0;
  let lastClient = null;

  let locked = -1;
  const lockOrigin = { x: 0, y: 0 };

  const releaseLock = () => {
    locked = -1;
  };

  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    pointer.y = 1 - (event.clientY - rect.top) / rect.height;
    pointer.inside =
      pointer.x >= 0 && pointer.x <= 1 && pointer.y >= 0 && pointer.y <= 1;

    if (lastClient) {
      travel += Math.hypot(
        event.clientX - lastClient.x,
        event.clientY - lastClient.y
      );
    } else {
      lastClient = { x: 0, y: 0 };
    }
    lastClient.x = event.clientX;
    lastClient.y = event.clientY;

    if (locked >= 0) {
      const travelled = Math.hypot(
        event.clientX - lockOrigin.x,
        event.clientY - lockOrigin.y
      );
      if (travelled > config.clickSlop) releaseLock();
    }
  };
  
  const onPointerLeave = () => {
    pointer.inside = false;
  };

  function focusCard(index) {
    const count = cards.length;
    const base = index - count / 2;
    const nearest =
      base + Math.round((scroll.state.current - base) / count) * count;
    scroll.goTo(nearest);
  }

  const press = { x: 0, y: 0 };

  const onPointerDown = (event) => {
    press.x = event.clientX;
    press.y = event.clientY;
    pointerSpeed = 0;
    travel = 0;
  };

  const onPointerUp = (event) => {
    if (!config.clickToFocus || hovered < 0) return;
    const travelled = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    if (travelled > config.clickSlop) return;

    locked = hovered;
    lockOrigin.x = event.clientX;
    lockOrigin.y = event.clientY;
    focusCard(hovered);
  };

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", releaseLock, { passive: true });

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    post.setSize(width, height, renderer.getPixelRatio());
    cardBuffer.setSize(width, height);
    trail.setSize(width, height, renderer.getPixelRatio());
  }

  const gui = createGui(config, {
    onGeometryChange: rebuildGeometry,
    onEntryReplay: beginEntry,
    onCameraChange() {
      camera.fov = config.fov;
      camera.position.z = config.cameraZ;
      camera.updateProjectionMatrix();
    },
    onBackgroundChange() {
      backgroundLinear.set(config.background);
      backgroundSRGB.copy(hexToSRGB(config.background));
    },
    onPaletteChange() {
      const u = post.compositeMaterial.uniforms;
      u.uInk.value.copy(hexToSRGB(config.ditherInk));
      u.uAccent.value.copy(hexToSRGB(config.ditherAccent));
      u.uPaper.value.copy(hexToSRGB(config.ditherPaper));
      u.uHoverInk.value.copy(hexToSRGB(config.hoverDitherInk));
      u.uHoverAccent.value.copy(hexToSRGB(config.hoverDitherAccent));
      u.uHoverPaper.value.copy(hexToSRGB(config.hoverDitherPaper));
      u.uTrailInk.value.copy(hexToSRGB(config.trailInk));
      u.uTrailAccent.value.copy(hexToSRGB(config.trailAccent));
      u.uTrailPaper.value.copy(hexToSRGB(config.trailPaper));
      u.uTrailRimColor.value.copy(hexToSRGB(config.trailRimColor));
      u.uEntryInk.value.copy(hexToSRGB(config.entryDitherInk));
      u.uEntryAccent.value.copy(hexToSRGB(config.entryDitherAccent));
      u.uEntryPaper.value.copy(hexToSRGB(config.entryDitherPaper));
    },
  });

  const onKeyDown = (event) => {
    if (event.key === "g" && !event.metaKey && !event.ctrlKey) {
      gui.show(gui._hidden);
    }
  };
  window.addEventListener("keydown", onKeyDown);

  let frame = 0;
  let activeIndex = -1;

  function tick() {
    frame = requestAnimationFrame(tick);

    config.autoSpin && (scroll.state.target += config.autoSpin);
    const progress = scroll.update();

    const total = cards.length;
    const centred = (((Math.round(progress + total / 2) % total) + total) % total);
    if (centred !== activeIndex) {
      activeIndex = centred;
      onActiveChange?.(activeIndex);
    }

    pointerSpeed += (travel - pointerSpeed) * 0.35;
    travel = 0;

    const settled =
      !config.hoverIntent || pointerSpeed <= config.hoverSettleSpeed;

    cardBuffer.render(camera);
    const picked =
      locked < 0 && pointer.inside ? cardBuffer.pick(pointer.x, pointer.y) : -1;
    hovered = locked >= 0 ? locked : settled ? picked : hovered;
    canvas.style.cursor = hovered >= 0 ? "pointer" : "default";

    const anyHovered = hovered >= 0;
    const count = cards.length;

    const entryElapsed = !config.entry
      ? Infinity
      : entryStart === null
        ? -Infinity
        : performance.now() - entryStart;

    const slotOf = (i) => {
      const slot = (i - progress) % count;
      return slot < 0 ? slot + count : slot;
    };
    const hoveredSlot = anyHovered ? slotOf(hovered) : 0;

    for (const [index, card] of cards.entries()) {
      const u = card.material.uniforms;
      const isHovered = index === hovered;
      const raw = card.userData.hoverRaw;

      const slot = slotOf(index);
      const separation = anyHovered ? Math.abs(slot - hoveredSlot) : 0;
      const dimTarget = anyHovered
        ? smoothstep(0, config.focusFalloff, separation)
        : 0;

      raw.hover = approach(raw.hover, isHovered ? 1 : 0, config);
      raw.dim = approach(raw.dim, dimTarget, config);

      const local = Math.min(
        1,
        Math.max(
          0,
          (entryElapsed - card.userData.entryOrder * config.entryStagger) /
            Math.max(1, config.entryDuration)
        )
      );
      card.userData.entry = Math.min(
        card.userData.entry,
        1 - smoothstep(0, 1, Math.pow(local, config.entryCurve))
      );

      u.uHover.value = Math.pow(raw.hover, config.hoverCurve);
      u.uDim.value = Math.pow(raw.dim, config.hoverCurve);
      u.uDimFade.value = config.dimFade;
      u.uEntry.value = card.userData.entry;
      u.uEntryScale.value = config.entryScale;
      u.uEntrySoftness.value = config.entrySoftness;
      u.uEntryAspect.value = entryAspect();
      u.uProgress.value = progress;
      u.uRadius.value = config.radius;
      u.uPitch.value = config.pitch;
      u.uAngleStep.value = config.angleStep;
      u.uCurve.value = config.curve;
      u.uShingle.value = config.shingle;
      u.uVelocity.value = scroll.state.bendVelocity;
      u.uBend.value = config.bend;
      u.uBendVertical.value = BEND_WEIGHTS[config.bendMode][0];
      u.uBendHorizontal.value = BEND_WEIGHTS[config.bendMode][1];
      u.uBackfaceFade.value = config.backfaceFade;
      u.uFogNear.value = config.fogNear;
      u.uFogFar.value = config.fogFar;
      u.uFogStrength.value = config.fogStrength;
    }

    const c = post.compositeMaterial.uniforms;
    c.uFocusSize.value = config.focusSize;
    c.uEdgePower.value = config.edgePower;
    c.uBlurStrength.value = config.blurStrength;
    c.uDitherScale.value = config.ditherScale;
    c.uMaxLevels.value = config.maxLevels;
    c.uMinLevels.value = config.minLevels;
    c.uFadeStrength.value = config.fadeStrength;
    c.uDitherAmount.value = config.dither ? config.ditherAmount : 0;
    c.uDitherStart.value = config.ditherStart;
    c.uDitherPower.value = config.ditherPower;
    c.uDitherDepth.value = config.ditherDepth;
    c.uGamma.value = config.ditherGamma;
    c.uMono.value = config.ditherMono;
    c.uDissolve.value = config.ditherDissolve;
    c.uHoverBlur.value = config.hoverBlur;
    c.uHoverBlurCurve.value = config.hoverBlurCurve;
    c.uHoverDither.value = config.hoverDither;
    c.uHoverDitherCurve.value = config.hoverDitherCurve;
    c.uHoverDitherLevels.value = config.hoverDitherLevels;
    c.uHoverDitherScale.value = config.hoverDitherScale;
    c.uHoverDitherCutoff.value = config.hoverDitherCutoff;
    c.uHoverGamma.value = config.hoverDitherGamma;
    c.uHoverMono.value = config.hoverDitherMono;
    c.uTrailAmount.value = config.trail ? config.trailAmount : 0;
    c.uTrailCutoff.value = config.trailCutoff;
    c.uTrailWarp.value = config.trailWarp;
    c.uTrailAberration.value = config.trailAberration;
    c.uTrailContrast.value = config.trailContrast;
    c.uTrailScale.value = config.trailScale;
    c.uTrailLevels.value = config.trailLevels;
    c.uTrailDissolve.value = config.trailDissolve;
    c.uTrailGamma.value = config.trailGamma;
    c.uTrailMono.value = config.trailMono;
    c.uTrailRim.value = config.trailRim;
    c.uTrailRimThickness.value = config.trailRimThickness;
    c.uTrailRimSoftness.value = config.trailRimSoftness;
    c.uEntryDither.value = config.entry ? config.entryDither : 0;
    c.uEntryScale.value = config.entryScale;
    c.uEntryLevels.value = config.entryDitherLevels;
    c.uEntryDissolve.value = config.entryDitherDissolve;
    c.uEntryGamma.value = config.entryDitherGamma;
    c.uEntryMono.value = config.entryDitherMono;
    c.uHoverClean.value = config.hoverClean;
    c.uCoupling.value = config.coupling;
    c.uStageStreakEnd.value = config.stageStreakEnd;
    c.uStageDitherBegin.value = config.stageDitherBegin;
    c.uStageHandoff.value = config.stageHandoff;
    c.uLift.value = config.lift;
    c.uDepthBlur.value = config.depthBlur;

    c.uTrail.value = trail.update();

    // Export card screen positions for labels overlay
    const cardPositions = cards.map((card, index) => {
      const worldPos = new THREE.Vector3();
      card.getWorldPosition(worldPos);
      const screenPos = worldPos.project(camera);
      return {
        index,
        x: (screenPos.x * 0.5 + 0.5) * window.innerWidth,
        y: (-(screenPos.y) * 0.5 + 0.5) * window.innerHeight,
        visible: screenPos.z < 1 && screenPos.z > 0
      };
    });
    window.__cardPositions = cardPositions;

    post.render(scene, camera);
  }

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  if (process.env.NODE_ENV !== "production") {
    window.__carousel = {
      renderer,
      scene,
      camera,
      cards,
      config,
      scroll,
      post,
      gui,
    };
  }

  resize();
  tick();

  return function dispose() {
    cancelAnimationFrame(frame);
    clearTimeout(entryWait);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("keydown", onKeyDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("wheel", releaseLock);
    scroll.dispose();
    post.dispose();
    cardBuffer.dispose();
    trail.dispose();
    gui.destroy();
    geometry.dispose();
    cards.forEach((card) => {
      card.material.uniforms.uMap.value?.dispose();
      card.material.dispose();
    });
    renderer.dispose();
  };
}