// One `edge` ramp drives blur level, quantization depth and fade together, so
// the top/bottom treatment reads as a single effect instead of three stacked.

import { bayerGLSL } from "./dither.js";

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Separable directional blur, run twice per level — along the streak axis at
// full spread, then across it at a fraction — for an elliptical kernel. A
// symmetric one reads as "out of focus", a stretched one reads as motion.
//
// Note the hovered card's light still feeds this chain even though its own blur
// is suppressed later, so it trails a streak of itself. That's deliberate. I
// tried holding it out and backed it out again — it needs a premultiplied
// weight carried through the whole chain, and substituting a colour instead
// just punches a hard-edged hole.
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

  // Hover rack focus, fully independant of the atmospheric settings above.
  uniform float uHoverBlur;
  uniform float uHoverBlurCurve;
  uniform float uHoverDither;
  uniform float uHoverDitherCurve;
  uniform float uHoverDitherLevels;
  uniform float uHoverDitherScale;
  uniform float uHoverDitherCutoff;
  uniform float uHoverClean;

  // Staging: how the streak and the dither divide up one dissolve.
  uniform float uCoupling;
  uniform float uStageStreakEnd;
  uniform float uStageDitherBegin;
  uniform float uStageHandoff;

  // Dither palettes. The quantized tone is read off a three-stop ramp rather
  // than written back as grey, so recession resolves into a fixed palette.
  // Frame-edge and hover each carry their own set: they answer to different
  // things — one to where a pixel sits, the other to whether the cursor is
  // elsewhere — so tying them to one palette meant tuning either was a
  // compromise against the other.
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

  // Entry. The odd one out: the other three answer to where a pixel sits or
  // what the cursor is doing, this one answers to time and runs once. The
  // arrival itself is a presence mask in the card pass — a card is drawn or it
  // isn't — and this only grains what has already appeared, so a card carries
  // some print while it lands and settles out of it.
  //
  // The drive arrives per card in the buffer's alpha, and stops at the same
  // edge the reveal does, so nothing is printed where nothing is drawn.
  uniform float uEntryDither;
  uniform float uEntryScale;
  uniform float uEntryLevels;
  uniform float uEntryDissolve;
  uniform vec3  uEntryInk;
  uniform vec3  uEntryAccent;
  uniform vec3  uEntryPaper;
  uniform float uEntryGamma;
  uniform float uEntryMono;

  // Cursor trail. Unlike the other two this one remembers — the buffer is the
  // previous frame decayed and smeared plus a stroke along the segment the
  // cursor covered, so r is how recently the trail passed through and gb is the
  // velocity it was carrying at the time.
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

  // ShaderMaterial gets no automatic output conversion, so do it by hand.
  // Quantizing has to happen after this — dithering in linear space puts every
  // visible step down in the shadows.
  vec3 linearToSRGB(vec3 c) {
    return mix(
      c * 12.92,
      1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
      step(vec3(0.0031308), c)
    );
  }

  // Blur chain blended down to one colour. Pulled out of main so the dithers
  // can resample it on their own cell grid without redoing the level weights.
  vec3 composed(vec2 uv, float lvl) {
    vec3 c = texture2D(uScene, uv).rgb;
    c = mix(c, texture2D(uBlur1, uv).rgb, clamp(lvl - 0.0, 0.0, 1.0));
    c = mix(c, texture2D(uBlur2, uv).rgb, clamp(lvl - 1.0, 0.0, 1.0));
    c = mix(c, texture2D(uBlur3, uv).rgb, clamp(lvl - 2.0, 0.0, 1.0));
    c = mix(c, texture2D(uBlur4, uv).rgb, clamp(lvl - 3.0, 0.0, 1.0));
    return c;
  }

  // Hand-off to display space. Fading toward the background before quantizing
  // lets the dither dissolve into the page instead of banding against it, and
  // the lift keeps the darkest values off zero — haze has no true black, and
  // that's most of what sells "seen through air".
  vec3 toDisplay(vec3 c, float fade) {
    c = linearToSRGB(c);
    c = mix(c, uBackground, fade);
    return mix(c, uBackground, uLift);
  }

  // Snap to the dither grid. Sampling at the cell centre is what makes the
  // pattern chunky: colour and Bayer threshold then both hold constant across a
  // cell so it fills flat. Skip it and every cell carries full-res detail
  // wearing a dot pattern, which reads as noise over the image rather than the
  // image being screen-printed.
  vec2 cellUv(float cell, vec2 offset) {
    return (floor(gl_FragCoord.xy / cell) + 0.5) * cell / uResolution + offset;
  }

  // Contrast lift inside the trail, so the dither has range to work with.
  vec3 grade(vec3 c, float amount) {
    return clamp((c - 0.5) * (1.0 + uTrailContrast * amount) + 0.5, 0.0, 1.0);
  }

  // Bundled so each dither can carry its own without every call growing an
  // eight-argument tail.
  struct Palette {
    vec3 ink;
    vec3 accent;
    vec3 paper;
    float gamma;
    float mono;
  };

  // Three-stop ramp. The accent is a discrete palette entry in the middle of
  // the range, not a tint — that's what makes one hue read as deliberate rather
  // than as a colour cast over everything. Set ink and paper the same and the
  // ramp becomes a band: both ends collapse together and only the middle lifts.
  vec3 ramp(Palette p, float t) {
    return t < 0.5
      ? mix(p.ink, p.accent, t * 2.0)
      : mix(p.accent, p.paper, (t - 0.5) * 2.0);
  }

  // Crush luminance to a few steps, dither the transitions, read the result off
  // the ramp. levels = 3 is the three-tone poster (ink, accent, paper) with
  // Bayer supplying the dot texture where two tones meet; higher counts thin it
  // out into grain. mono = 0 keeps the image's own hues instead, quantized per
  // channel on the same steps.
  vec3 poster(Palette p, vec3 c, float threshold, float levels) {
    float steps = max(levels - 1.0, 1.0);
    float tone = pow(clamp(luma(c), 0.0, 1.0), p.gamma);
    vec3 toned = ramp(p, floor(tone * steps + threshold) / steps);
    vec3 quantized = floor(c * steps + threshold) / steps;
    return mix(quantized, toned, p.mono);
  }

  // Two ways to bring a dither in. A cross-fade dips the area through a
  // washed-out half-postered state that reads like a transparency checkerboard;
  // thresholding the drive against the same Bayer value flips each cell on its
  // own, so the image breaks apart into the pattern instead. Per effect,
  // because the trail wants the hard version even while the others cross-fade.
  float ditherMask(float drive, float threshold, float dissolve) {
    return mix(drive, drive > threshold ? 1.0 : 0.0, dissolve);
  }

  void main() {
    // 0 at frame center, 1 at top and bottom edges.
    float d = abs(vUv.y - 0.5) * 2.0;
    float edge = smoothstep(uFocusSize, 1.0, d);
    edge = pow(edge, uEdgePower);

    vec4 scene = texture2D(uScene, vUv);
    vec4 card = texture2D(uCardBuffer, vUv);
    float dim = pow(card.g, uHoverBlurCurve);

    // Stored as arrived-ness so the cleared background counts as done.
    float entry = 1.0 - card.a;

    // Exemption for the hovered card. Frame-edge blur, fade and dither are all
    // functions of screen position, so without this a card you'd resolved by
    // hovering it would still come out smeared and screen-printed just for
    // sitting near the top or bottom of the frame.
    float clean = card.b * uHoverClean;
    float keep = 1.0 - clean;

    // Two reasons a pixel recedes: distance (haze), or nearness to the top and
    // bottom edges. Whichever is stronger becomes the master progression the
    // dissolve is staged against, so streak and dither read as two phases of
    // one event rather than two effects that happen to overlap.
    float distance = 1.0 - scene.a;
    float dissolve = max(edge, distance * uDepthBlur);

    // Loose: each effect on its own terms.
    float recession = max(d, distance * uDitherDepth);
    float ditherLoose = pow(smoothstep(uDitherStart, 1.0, recession), uDitherPower);

    // Tight: the streak owns the near part of the dissolve and yields as the
    // dither takes the far part. uStageHandoff is how much ground it gives up —
    // at 1 it retreats completely and the extreme is pure grain, at 0 it holds
    // full strength underneath and the two stack.
    float ditherTight =
      pow(smoothstep(uStageDitherBegin, 1.0, dissolve), uDitherPower);
    float streakTight = smoothstep(0.0, uStageStreakEnd, dissolve);
    streakTight *= 1.0 - ditherTight * uStageHandoff;

    float blurDrive = mix(dissolve, streakTight, uCoupling);
    float ditherDrive = mix(ditherLoose, ditherTight, uCoupling);

    float softness = max(blurDrive, dim * uHoverBlur);
    softness *= keep;

    // Progressive blur: walk up the mip chain as softness grows.
    float lvl = softness * uBlurStrength * 4.0;
    float fade = edge * uFadeStrength * keep;

    // --- cursor trail -------------------------------------------------------
    vec4 trail = texture2D(uTrail, vUv);
    float trailMask = clamp(trail.r, 0.0, 1.0);
    vec2 trailVelocity = trail.gb;

    // Drag the sample along the cursor's direction of travel. The clean image
    // moves at half rate while the dithers use the full push, so the frame
    // reads as one surface reacting instead of a patch pasted over a still one.
    vec2 push = trailVelocity * uTrailWarp * trailMask;
    vec2 shift = trailVelocity * uTrailAberration * trailMask;

    vec3 base = composed(vUv + push * 0.5, lvl);

    // Uniform branch, so no cost at the default of no split. Only the clean
    // image gets separated — the dithers are already crushed to a few tones,
    // where a per-channel offset has almost nothing left to seperate.
    if (uTrailAberration > 0.0) {
      base.r = composed(vUv + push * 0.5 + shift * 0.35, lvl).r;
      base.b = composed(vUv + push * 0.5 - shift * 0.35, lvl).b;
    }

    // Blur happens in linear light; toDisplay is the hand-off to display space.
    vec3 c = toDisplay(base, fade);

    // Frame-edge dither. It gets its own ramp instead of reusing the blur's —
    // sharing one meant it started the instant the blur did, and this way it
    // can hold off until much closer to the edge and come in at its own rate.
    // It answers to recession as well as screen position, which is what lets a
    // dimmed card dither: dimming rides in the same channel as distance, so
    // receding and being unhovered amount to the same thing here.
    //
    // Levels ramp along the drive so the pattern coarsens as the dissolve
    // deepens. That works because this is a gradient across space rather than
    // something switching on in time.
    float edgeLevels = max(mix(uMaxLevels, uMinLevels, ditherDrive), 2.0);
    float edgeThreshold = bayer8(gl_FragCoord.xy / uDitherScale);
    // Uniform branch, coherent across the draw. At cell size 1 the snap is a
    // no-op and the extra composite would be wasted.
    vec3 edgeSource = uDitherScale > 1.0
      ? toDisplay(composed(cellUv(uDitherScale, push), lvl), fade)
      : c;

    Palette edgePalette = Palette(uInk, uAccent, uPaper, uGamma, uMono);

    vec3 result = mix(
      c,
      poster(edgePalette, edgeSource, edgeThreshold, edgeLevels),
      ditherMask(uDitherAmount * ditherDrive * keep, edgeThreshold, uDissolve)
    );

    // Hover dither is a cross-fade rather than a ramp. Quantization is
    // evaluated at its final settings up front and then blended in, so the
    // pattern keeps its grain the whole way and simply becomes visible. Driving
    // levels off the hover value instead made it coarsen as it arrived, which
    // reads as the effect intensifying rather than fading in.
    float hoverRamp = pow(card.g, uHoverDitherCurve);

    // Floor the tail to zero or the pattern never finishes leaving. Dim eases
    // out exponentially so it approaches 0 without arriving, and cells drop out
    // as the ramp falls past each one's Bayer threshold — so the surviving
    // count halves at a fixed rate instead of running out. The bulk goes at
    // once and a scatter of stragglers hangs on for as long again. Cutting off
    // early gives it a definite end; smoothstep rather than a hard clamp so the
    // last cells still ease out instead of all popping on one frame.
    hoverRamp = smoothstep(uHoverDitherCutoff, 1.0, hoverRamp) * uHoverDither;

    float hoverLevels = max(uHoverDitherLevels, 2.0);
    float hoverThreshold = bayer8(gl_FragCoord.xy / uHoverDitherScale);
    vec3 hoverSource = uHoverDitherScale > 1.0
      ? toDisplay(composed(cellUv(uHoverDitherScale, push), lvl), fade)
      : c;

    // Postered from the clean colour, not the edge-dithered one. The two
    // overlap wherever a dimmed card drifts toward the frame edge, and
    // posterizing an already-postered pixel re-reads the accent's luminance off
    // the ramp, collapsing that whole band into the ink. Drawn second, so hover
    // owns the overlap on its own settings.
    Palette hoverPalette =
      Palette(uHoverInk, uHoverAccent, uHoverPaper, uHoverGamma, uHoverMono);

    result = mix(
      result,
      poster(hoverPalette, hoverSource, hoverThreshold, hoverLevels),
      ditherMask(hoverRamp, hoverThreshold, uDissolve)
    );

    // --- trail dither -------------------------------------------------------
    // Drawn last. The cursor is the most immediate thing on screen, so where it
    // crosses a card already dithered for depth or hover, the trail is what you
    // should be reading. Sourced from the clean colour like the others.
    float trailThreshold = bayer8(gl_FragCoord.xy / uTrailScale);
    // The cutoff floors the faint tail of the mask. Without it the lowest Bayer
    // thresholds still fire on residue of ~0.02, scattering stray cells well
    // outside the trail that then linger as the buffer decays.
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

    // Rim band, derived from trailShaped so it can't reach past the dither it's
    // outlining. rimDist is 0 mid-dissolve and 1 at both ends, so thickness
    // grows the band out from the middle and softness feathers both edges.
    // Mixed rather than added — adding a dark rim colour would be a no-op.
    float rimDist = abs(trailShaped - 0.5) * 2.0;
    float rimSoft = max(uTrailRimSoftness, 0.001);
    float rim = 1.0 -
      smoothstep(uTrailRimThickness - rimSoft, uTrailRimThickness + rimSoft, rimDist);
    result = mix(result, uTrailRimColor, rim * uTrailRim);

    // --- entry --------------------------------------------------------------
    // Drawn over everything, including the trail. While a card is still
    // arriving that's the whole story — showing the standing dithers through it
    // reads as two effects competing rather than one thing resolving. It's off
    // a few seconds after load and costs one uniform branch after that, since
    // the drive is zero everywhere and the mix collapses.
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
