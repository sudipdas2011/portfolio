import * as THREE from "three";
import { config, IMAGES } from "./config.js";
import { cardVertex, cardFragment } from "./shaders/card.js";
import { createScrollController } from "./scroll.js";
import { createPostPipeline } from "./post.js";
import { createCardBuffer } from "./cardbuffer.js";
import { createTrail } from "./trail.js";
import { createGui } from "./gui.js";
import { hexToSRGB } from "./color.js";

// A texture request that neither loads nor errors — a hung connection — would
// hold the entry forever, and the frame behind it is empty. Start anyway.
const ENTRY_WAIT_LIMIT = 5000;

// [vertical, horizontal] weights per mode. "both" runs each below full so
// combining them doesn't double the deflection.
const BEND_WEIGHTS = {
  vertical: [1, 0],
  horizontal: [0, 1],
  both: [0.7, 0.7],
};

// Asymmetric ease — separate rates for rising and falling, so hover can arrive
// at a different speed than it leaves.
function approach(current, target, config) {
  const rate = target > current ? config.hoverInEase : config.hoverOutEase;
  return current + (target - current) * rate;
}

// 1 makes the entry front a circle on the card, 0 an ellipse in its own shape.
// Folded into the aspect the shader already takes rather than sent as a second
// uniform — the reveal only ever uses the two together.
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

  // The scene pass works in linear light, the composite writes straight to the
  // framebuffer in display space. Same colour, kept in both forms.
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
    // Width segments let the vertex shader wrap the card around the cylinder.
    // Height segments are there purely for the horizontal bend — its falloff
    // runs down the card, so with one segment uv.y is only ever 0 or 1 and the
    // card shifts bodily instead of bowing.
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
        // Read by the visible pass and, through the shared uniform objects, by
        // the card buffer — so the reveal, the hit test and the composite's
        // entry channel all stop at the same edge.
        uEntry: { value: 1 },
        uEntryScale: { value: config.entryScale },
        uEntrySoftness: { value: config.entrySoftness },
        uEntryAspect: { value: entryAspect() },
      },
      // Culling backfaces would drop every card past 90°, which is most of the
      // ribbon at this angle step. The mirrored texture doesn't matter since
      // backfaceFade and haze reduce them to pale ghosts anyway.
      side: THREE.DoubleSide,
      // Alpha carries depth here, not coverage — blending would multiply it
      // into the colour and wash out the near cards.
      blending: THREE.NoBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Kept unshaped; the curve is applied on the way to the shader.
    mesh.userData.hoverRaw = { hover: 0, dim: 0 };
    // 1 is absent, 0 is arrived. Only ever falls, so a card can't un-arrive.
    // Its place in the running order is stored rather than its delay, so the
    // stagger slider still does something while the arrival is playing.
    mesh.userData.entry = 1;
    mesh.userData.entryOrder = index;
    // Positions come entirely from the vertex shader, so the CPU-side bounding
    // sphere is meaningless.
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
      // A card that failed to load still has to be counted, or one 404 holds
      // the entry for the whole wait limit.
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

  // Built after the cards so it can borrow their uniform objects.
  const cardBuffer = createCardBuffer(renderer, scene, cards, config);
  post.compositeMaterial.uniforms.uCardBuffer.value = cardBuffer.texture;

  // --- entry ----------------------------------------------------------------
  // Two halves of one arrival: a timed tween on the scroll for the spin, and a
  // per-card front in the frame loop for the reveal. Both start together, held
  // back until the last texture has settled — a card with no map renders black,
  // so opening sooner spends the move on empty rectangles.
  let pending = IMAGES.length;
  let entryStart = null;

  // Fisher-Yates. Reshuffled on every run: a fixed order is legible after two
  // or three viewings and starts to read as a sequence being replayed rather
  // than as the set landing.
  function shuffleEntryOrder() {
    const order = cards.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    cards.forEach((card, index) => (card.userData.entryOrder = order[index]));
  }

  // Parks the helix where the arrival begins. Called before the first frame as
  // well, so the wait for textures is spent at the start of the move rather
  // than sitting at the resting position and jumping backwards to open.
  function parkForEntry() {
    scroll.state.current = -config.entrySpin;
    scroll.state.target = scroll.state.current;
    shuffleEntryOrder();
    for (const card of cards) {
      card.userData.entry = 1;
      // Written straight through as well as onto the card. The buffer is drawn
      // at the top of the frame and only picks up uniforms the loop below sets,
      // so going through the loop alone would draw one frame of whole cards —
      // and this runs on the frame the textures land, which is exactly when
      // that frame would be visible.
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

  // Counts down to the open. Guarded against the wait limit having fired first,
  // which would otherwise restart the entry as the late textures trickled in.
  function textureSettled() {
    if (pending === 0 || --pending > 0) return;
    clearTimeout(entryWait);
    beginEntry();
  }

  if (config.entry) parkForEntry();

  const pointer = { x: 0, y: 0, inside: false };
  let hovered = -1;

  // Pointer travel, accumulated as events land and consumed once a frame.
  // Measured event to event, not frame to frame — several pointermoves can
  // arrive between two frames, and comparing only the newest against the last
  // frame reads a fast flick as one short step.
  let travel = 0;
  let pointerSpeed = 0;
  let lastClient = null;

  // Clicking a card sends it to the centre, which slides it out from under a
  // stationary cursor. Picking re-runs every frame, so focus would jump to
  // whatever card passes beneath instead of staying on the one being brought
  // forward. Hold it until the pointer actually moves.
  let locked = -1;
  const lockOrigin = { x: 0, y: 0 };

  const releaseLock = () => {
    locked = -1;
  };

  const onPointerMove = (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (event.clientX - rect.left) / rect.width;
    // Flipped: readRenderTargetPixels measures from the bottom.
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

    // Measured from where the click happened rather than the last frame, so
    // sub-pixel jitter can't release the lock on its own.
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

  // Bring a card to the focus band.
  function focusCard(index) {
    const count = cards.length;
    // A card is centred when its slot equals half the count, and slot is
    // mod(index - progress, count), so progress has to be index minus half.
    const base = index - count / 2;
    // Which is true of infinitely many values a loop apart. Take the nearest to
    // where we already are, otherwise clicking a card just above the top of the
    // frame can unwind the whole helix to reach it the long way round.
    const nearest =
      base + Math.round((scroll.state.current - base) / count) * count;
    scroll.goTo(nearest);
  }

  const press = { x: 0, y: 0 };

  const onPointerDown = (event) => {
    press.x = event.clientX;
    press.y = event.clientY;
    // A press is a decision, so stop holding hover back. Otherwise a click at
    // the end of a fast move acts on whatever card the settle test was still
    // holding rather than the one actually under the cursor.
    pointerSpeed = 0;
    travel = 0;
  };

  const onPointerUp = (event) => {
    if (!config.clickToFocus || hovered < 0) return;
    // A drag that happens to end over a card isn't a click on it, so only count
    // it if the pointer barely moved.
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
  // Scrolling is as much a decision to move on as moving the cursor, and
  // holding focus on a card you're scrolling away from just reads as stuck.
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
    // An arrival can't be tuned if it only plays once per reload.
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
    // Hex parsing is cheap but pointless every frame, so palettes get pushed on
    // change rather than alongside the sliders in tick.
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

  // Panel starts hidden and lil-gui binds no keys of its own, so `g` toggles.
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

    // Centred index is progress plus half a turn, rounded. Only reported on
    // change so we're not touching the DOM every frame.
    const total = cards.length;
    const centred = (((Math.round(progress + total / 2) % total) + total) % total);
    if (centred !== activeIndex) {
      activeIndex = centred;
      onActiveChange?.(activeIndex);
    }

    // Client pixels per frame, smoothed so one stray event can't flip the
    // state. Client pixels rather than uv, so it means the same thing at any
    // window size.
    pointerSpeed += (travel - pointerSpeed) * 0.35;
    travel = 0;

    // Hover intent. A sweep drags the cursor over card after card and each one
    // starts resolving before being abandoned a frame later, which makes the
    // whole rack focus blink. So hover only changes hands once the pointer has
    // slowed to the speed of aiming. Above that it holds what it had rather
    // than dropping to nothing — releasing mid-sweep would un-resolve the card
    // you just left, which is the same flicker seen from the other side.
    const settled =
      !config.hoverIntent || pointerSpeed <= config.hoverSettleSpeed;

    // Re-picked every frame rather than only on pointermove, because the helix
    // keeps turning under a stationary cursor and the card beneath it changes.
    // The buffer must be drawn before it can be read.
    cardBuffer.render(camera);
    // Skipped entirely while locked — it's a synchronous GPU readback and the
    // answer gets discarded anyway.
    const picked =
      locked < 0 && pointer.inside ? cardBuffer.pick(pointer.x, pointer.y) : -1;
    hovered = locked >= 0 ? locked : settled ? picked : hovered;
    canvas.style.cursor = hovered >= 0 ? "pointer" : "default";

    const anyHovered = hovered >= 0;
    const count = cards.length;

    // Entry clock, in ms since the arrival opened. A null start means the
    // textures aren't in yet, so cards stay away rather than arriving black;
    // the master switch brings all of them in on the spot instead. Both ends
    // are infinities so the per-card arithmetic below needs no special case.
    const entryElapsed = !config.entry
      ? Infinity
      : entryStart === null
        ? -Infinity
        : performance.now() - entryStart;

    // Slot, not index, and deliberately not wrapped. The first and last slots
    // are neighbours in the loop but sit at opposite ends of the frame, so
    // wrapping the distance would call them adjacent.
    const slotOf = (i) => {
      const slot = (i - progress) % count;
      return slot < 0 ? slot + count : slot;
    };
    const hoveredSlot = anyHovered ? slotOf(hovered) : 0;

    for (const [index, card] of cards.entries()) {
      const u = card.material.uniforms;
      const isHovered = index === hovered;
      const raw = card.userData.hoverRaw;

      // Dim falls off with distance along the helix rather than switching on
      // for every other card at once, so neighbours stay partly legible and
      // only distant cards dissolve. That reads as focus instead of an overlay.
      // The hovered card sits at distance 0, so it lands on zero dim with no
      // special case needed.
      const slot = slotOf(index);
      const separation = anyHovered ? Math.abs(slot - hoveredSlot) : 0;
      const dimTarget = anyHovered
        ? smoothstep(0, config.focusFalloff, separation)
        : 0;

      raw.hover = approach(raw.hover, isHovered ? 1 : 0, config);
      raw.dim = approach(raw.dim, dimTarget, config);

      // Entry. Each card waits out its place in the running order, then opens
      // over its own duration. Held to falling only, so dragging a slider
      // mid-arrival can only ever bring cards in — recomputing freely would
      // send ones already on screen back out, which reads as a glitch rather
      // than as the retune it is.
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

      // Shaped on the way into the shader, so the eased state stays linear and
      // the curve can be changed live without jumping.
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

    // Stepped before the composite reads it, so the stroke painted this frame
    // is the one on screen rather than one frame stale.
    c.uTrail.value = trail.update();

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