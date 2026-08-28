import GUI from "lil-gui";

export function createGui(config, handlers) {
  const gui = new GUI({ title: "dither blur" });
  gui.hide();

  const helix = gui.addFolder("helix");
  helix.add(config, "radius", 1, 10, 0.05);
  helix.add(config, "pitch", 0.1, 4, 0.01);
  helix.add(config, "angleStep", 0.05, 1.5, 0.005);
  helix.add(config, "curve", 0, 1, 0.01).name("curve (flat → wrapped)");
  helix.add(config, "shingle", 0, 0.2, 0.005).name("shingle (depth offset)");
  helix.add(config, "backfaceFade", 0, 1, 0.01);
  helix
    .add(config, "cardWidth", 0.5, 8, 0.05)
    .onFinishChange(handlers.onGeometryChange);
  helix
    .add(config, "cardHeight", 0.5, 6, 0.05)
    .onFinishChange(handlers.onGeometryChange);

  const camera = gui.addFolder("camera");
  camera.add(config, "cameraZ", 3, 25, 0.1).onChange(handlers.onCameraChange);
  camera.add(config, "fov", 15, 90, 0.5).onChange(handlers.onCameraChange);

  const scroll = gui.addFolder("scroll");
  scroll.add(config, "wheelStrength", 0.0002, 0.01, 0.0001);
  scroll.add(config, "dragStrength", 0.001, 0.03, 0.0005);
  scroll.add(config, "ease", 0.01, 0.3, 0.005);
  scroll.add(config, "autoSpin", 0, 0.02, 0.0005);

  const snap = gui.addFolder("snap to centre");
  snap.add(config, "snap").name("enabled");
  snap.add(config, "snapSpeed", 0.002, 0.1, 0.002).name("settles below");
  snap.add(config, "snapDelay", 0, 600, 10).name("input delay (ms)");
  snap.add(config, "snapStiffness", 0.01, 0.4, 0.005).name("spring stiffness");
  snap.add(config, "snapDamping", 0.3, 0.95, 0.01).name("spring damping");

  // The arrival. `replay` reruns it in place — it plays once per reload
  // otherwise, which is no way to tune anything.
  const entry = gui.addFolder("entry");
  entry.add(config, "entry").name("enabled");
  entry.add({ replay: handlers.onEntryReplay }, "replay").name("▶ replay");
  entry.add(config, "entryDuration", 150, 4000, 50).name("per card (ms)");
  entry.add(config, "entryStagger", 0, 400, 5).name("card to card (ms)");
  entry.add(config, "entryCurve", 0.3, 4, 0.05).name("open curve");
  entry.add(config, "entrySoftness", 0, 1.5, 0.01).name("front softness");
  entry.add(config, "entryRound", 0, 1, 0.01).name("front roundness");
  entry.add(config, "entryScale", 1, 24, 0.5).name("cell size");
  entry.add(config, "entrySpin", 0, 12, 0.1).name("slots travelled");
  entry
    .add(config, "entrySpinDuration", 400, 6000, 50)
    .name("spin duration (ms)");
  entry.add(config, "entryEaseIn", 0, 1, 0.01).name("spin ease in");
  entry.add(config, "entryEaseOut", 0, 0.98, 0.01).name("spin ease out");

  const entryDither = gui.addFolder("entry — dither");
  entryDither.add(config, "entryDither", 0, 1, 0.01).name("intensity");
  entryDither.add(config, "entryDitherLevels", 2, 8, 1).name("tones");
  entryDither
    .add(config, "entryDitherDissolve", 0, 1, 0.01)
    .name("dissolve (0 = fade)");
  entryDither.add(config, "entryDitherGamma", 0.4, 4, 0.05).name("tone bias");
  entryDither.add(config, "entryDitherMono", 0, 1, 0.01).name("photo → poster");
  entryDither
    .addColor(config, "entryDitherInk")
    .name("ink")
    .onChange(handlers.onPaletteChange);
  entryDither
    .addColor(config, "entryDitherAccent")
    .name("accent")
    .onChange(handlers.onPaletteChange);
  entryDither
    .addColor(config, "entryDitherPaper")
    .name("paper")
    .onChange(handlers.onPaletteChange);

  const hover = gui.addFolder("hover — easing");
  hover.add(config, "hoverInEase", 0.01, 0.6, 0.005).name("ease in");
  hover.add(config, "hoverOutEase", 0.01, 0.6, 0.005).name("ease out");
  hover.add(config, "hoverCurve", 0.3, 4, 0.05).name("ease curve");
  hover.add(config, "dimFade", 0, 1, 0.01).name("others brightness");
  hover.add(config, "focusFalloff", 0.5, 12, 0.1).name("focus falloff");
  hover.add(config, "hoverClean", 0, 1, 0.01).name("clean hovered card");
  hover.add(config, "hoverIntent").name("hover intent");
  hover
    .add(config, "hoverSettleSpeed", 1, 60, 0.5)
    .name("aims below (px/frame)");
  hover.add(config, "clickToFocus").name("click to centre");
  hover
    .add(config, "focusDuration", 200, 3000, 50)
    .name("centre duration (ms)");
  hover.add(config, "focusEaseIn", 0, 1, 0.01).name("centre ease in");
  hover.add(config, "focusEaseOut", 0, 0.98, 0.01).name("centre ease out");

  const hoverBlur = gui.addFolder("hover — blur");
  hoverBlur.add(config, "hoverBlur", 0, 1, 0.01).name("blur amount");
  hoverBlur.add(config, "hoverBlurCurve", 0.3, 4, 0.05).name("blur curve");

  const hoverDither = gui.addFolder("hover — dither");
  hoverDither.add(config, "hoverDither", 0, 1, 0.01).name("dither amount");
  hoverDither
    .add(config, "hoverDitherCurve", 0.3, 4, 0.05)
    .name("dither curve");
  hoverDither.add(config, "hoverDitherLevels", 2, 8, 1).name("tones");
  hoverDither.add(config, "hoverDitherScale", 1, 24, 0.5).name("cell size");
  hoverDither
    .add(config, "hoverDitherCutoff", 0, 0.5, 0.01)
    .name("fade-out cutoff");
  hoverDither.add(config, "hoverDitherGamma", 0.4, 4, 0.05).name("tone bias");
  hoverDither.add(config, "hoverDitherMono", 0, 1, 0.01).name("photo → poster");
  hoverDither
    .addColor(config, "hoverDitherInk")
    .name("ink")
    .onChange(handlers.onPaletteChange);
  hoverDither
    .addColor(config, "hoverDitherAccent")
    .name("accent")
    .onChange(handlers.onPaletteChange);
  hoverDither
    .addColor(config, "hoverDitherPaper")
    .name("paper")
    .onChange(handlers.onPaletteChange);

  const bend = gui.addFolder("motion bend");
  bend.add(config, "bend", 0, 10, 0.1).name("bend amount");
  bend
    .add(config, "bendMode", ["vertical", "horizontal", "both"])
    .name("bend axis");
  bend.add(config, "bendEase", 0.02, 0.5, 0.01).name("bend easing");
  bend.add(config, "bendMaxVelocity", 0.01, 0.2, 0.005).name("max bend");

  const atmosphere = gui.addFolder("atmosphere");
  atmosphere.add(config, "fogNear", 0, 20, 0.1).name("haze starts");
  atmosphere.add(config, "fogFar", 1, 40, 0.1).name("haze full");
  atmosphere.add(config, "fogStrength", 0, 1, 0.01).name("haze amount");
  atmosphere.add(config, "depthBlur", 0, 1, 0.01).name("distance softens");
  atmosphere.add(config, "lift", 0, 0.4, 0.005).name("black lift");

  const edge = gui.addFolder("edge — streak");
  edge.add(config, "focusSize", 0, 0.9, 0.01).name("focus band size");
  edge.add(config, "edgePower", 0.2, 4, 0.05).name("ramp curve");
  edge.add(config, "blurStrength", 0, 1.5, 0.01);
  edge.add(config, "streakAngle", 0, 180, 1).name("streak angle");
  edge.add(config, "streakSpread", 0.2, 6, 0.1).name("streak length");
  edge.add(config, "streakAnisotropy", 0, 1, 0.01).name("cross blur");
  edge.add(config, "fadeStrength", 0, 1, 0.01).name("fade to bg");

  const stage = gui.addFolder("dissolve — staging");
  stage.add(config, "coupling", 0, 1, 0.01).name("coupling (0 = loose)");
  stage.add(config, "stageStreakEnd", 0.1, 1, 0.01).name("streak full by");
  stage.add(config, "stageDitherBegin", 0, 0.95, 0.01).name("dither starts at");
  stage.add(config, "stageHandoff", 0, 1, 0.01).name("streak yields");

  // Frame-edge dither. Its palette and tone controls mirror the hover folder's
  // above, and the two are fully independant of each other.
  const dither = gui.addFolder("dither");
  dither.add(config, "dither").name("enabled");
  dither.add(config, "ditherAmount", 0, 1, 0.01).name("intensity");
  dither.add(config, "ditherScale", 1, 24, 0.5).name("cell size");
  dither.add(config, "maxLevels", 2, 8, 1).name("tones @ center");
  dither.add(config, "minLevels", 2, 8, 1).name("tones @ edge");
  dither.add(config, "ditherGamma", 0.4, 4, 0.05).name("tone bias");
  dither.add(config, "ditherMono", 0, 1, 0.01).name("photo → poster");
  dither.add(config, "ditherDissolve", 0, 1, 0.01).name("dissolve (0 = fade)");
  dither
    .addColor(config, "ditherInk")
    .name("ink")
    .onChange(handlers.onPaletteChange);
  dither
    .addColor(config, "ditherAccent")
    .name("accent")
    .onChange(handlers.onPaletteChange);
  dither
    .addColor(config, "ditherPaper")
    .name("paper")
    .onChange(handlers.onPaletteChange);
  dither.add(config, "ditherStart", 0, 1, 0.01).name("starts at");
  dither.add(config, "ditherPower", 0.2, 4, 0.05).name("ramp curve");
  dither.add(config, "ditherDepth", 0, 1, 0.01).name("distance triggers");

  // Cursor trail — the same dither machinery as the two folders above, but
  // driven by a buffer that remembers where the pointer has been.
  const trail = gui.addFolder("cursor trail");
  trail.add(config, "trail").name("enabled");
  trail.add(config, "trailRadius", 10, 500, 1).name("size (px)");
  trail.add(config, "trailSmoothing", 0.05, 1, 0.01).name("lag");
  trail.add(config, "trailDecay", 0.85, 0.995, 0.001).name("persistence");
  trail.add(config, "trailIdleDelay", 0, 1500, 10).name("idle after (ms)");
  trail.add(config, "trailIdleDecay", 0.5, 0.995, 0.001).name("idle clear-out");
  trail.add(config, "trailDissipate", 0, 6, 0.1).name("spread");
  trail.add(config, "trailSpeedInfluence", 0, 1, 0.01).name("speed → size");
  trail.add(config, "trailSpeedRange", 1, 60, 0.5).name("full speed at");
  trail.add(config, "trailIdleDrift").name("idle drift");

  const trailLook = gui.addFolder("cursor trail — look");
  trailLook.add(config, "trailAmount", 0, 1, 0.01).name("intensity");
  trailLook.add(config, "trailCutoff", 0, 0.6, 0.005).name("edge cutoff");
  trailLook.add(config, "trailWarp", 0, 0.6, 0.01).name("warp");
  trailLook.add(config, "trailAberration", 0, 0.3, 0.005).name("rgb split");
  trailLook.add(config, "trailContrast", 0, 3, 0.01).name("contrast");
  trailLook.add(config, "trailScale", 1, 24, 0.5).name("cell size");
  trailLook.add(config, "trailLevels", 2, 8, 1).name("tones");
  trailLook
    .add(config, "trailDissolve", 0, 1, 0.01)
    .name("dissolve (0 = fade)");
  trailLook.add(config, "trailGamma", 0.4, 4, 0.05).name("tone bias");
  trailLook.add(config, "trailMono", 0, 1, 0.01).name("photo → poster");
  trailLook
    .addColor(config, "trailInk")
    .name("ink")
    .onChange(handlers.onPaletteChange);
  trailLook
    .addColor(config, "trailAccent")
    .name("accent")
    .onChange(handlers.onPaletteChange);
  trailLook
    .addColor(config, "trailPaper")
    .name("paper")
    .onChange(handlers.onPaletteChange);
  trailLook.add(config, "trailRim", 0, 1, 0.01).name("rim light");
  trailLook
    .addColor(config, "trailRimColor")
    .name("rim colour")
    .onChange(handlers.onPaletteChange);
  trailLook.add(config, "trailRimThickness", 0, 1, 0.01).name("rim thickness");
  trailLook.add(config, "trailRimSoftness", 0, 1, 0.01).name("rim softness");

  gui.addColor(config, "background").onChange(handlers.onBackgroundChange);

  return gui;
}
