// Every tunable lives here and is wired straight to lil-gui, so the whole look
// can be dialled in the browser instead of by editing shaders. Press `g` to
// open the panel.

export const config = {
  // Helix
  radius: 3.8,
  pitch: 1.27,
  angleStep: 0.8,
  curve: 1.0,
  cardWidth: 3.2,
  cardHeight: 1.6,
  // Steps each card's radius so overlapping neighbours don't z-fight.
  shingle: 0.055,
  backfaceFade: 0,

  // Atmosphere — contrast falls off with distance into the helix
  fogNear: 8.0,
  fogFar: 20.6,
  fogStrength: 1.0,
  depthBlur: 1.0,
  lift: 0,

  // Camera
  cameraZ: 10,
  fov: 48,

  // Scroll
  wheelStrength: 0.0022,
  dragStrength: 0.007,
  ease: 0.075,
  autoSpin: 0.0,

  // Snap — once a fling has mostly spent itself, settle on the nearest card
  // rather than stopping wherever the drift ran out.
  snap: true,
  snapSpeed: 0.02,
  // Quiet time after the last input before snapping may engage. Has to clear
  // the gap between wheel events inside one gesture (~30-60ms), otherwise the
  // snap fires mid-scroll and drags each notch back before the next arrives.
  snapDelay: 300,
  // Spring, not a lerp. Damping reads backwards from the usual sense: LOW kills
  // the motion fast and glides in dead, HIGH lets the card overshoot and rock.
  snapStiffness: 0.04,
  snapDamping: 0.54,

  // Entry — the arrival. Cards start absent, not faint: each one materializes
  // as a dithered disc opening out from its own centre, cell by cell against
  // the Bayer grid. Nothing is drawn outside that front, so the blur chain has
  // no light to smear and a card that hasn't arrived casts no streak.
  //
  // Held until the last texture is in — cards render black without one, so
  // starting sooner spends the arrival on empty rectangles. Press `replay` in
  // the panel to see it again without reloading.
  entry: true,
  // Per card, not for the whole set. Total = entryDuration + stagger × cards.
  entryDuration: 1050,
  // Between one card appearing and the next. The order is reshuffled every
  // time the arrival runs, so it reads as cards landing rather than as a
  // sequence being played.
  entryStagger: 60,
  // Bias on one card's own front. Above 1 holds the centre closed then opens
  // late, below 1 opens at once and creeps the last of the way.
  entryCurve: 1.0,
  // Width of the dithered front as a fraction of the card, and the cell it
  // breaks up on in device pixels. Softness is the whole character of this: at
  // 0 it's a clean expanding circle, wide enough and the card arrives as a
  // scatter of cells with no visible edge at all.
  entrySoftness: 0.45,
  entryScale: 9.5,
  // How round the front is. At 1 it's a true circle, which on a 2:1 card
  // reaches the top and bottom edges at 45% and spends the rest of the arrival
  // growing sideways as a band. At 0 it follows the card's own shape and every
  // edge arrives together. Rides in with the aspect, so it costs no uniform.
  entryRound: 1,

  // The spin. Runs on its own clock rather than the cards' — it's one move for
  // the whole helix, and it wants to still be gliding as the last card lands.
  // Nearly a full turn of the loop, so the helix is travelling fast enough
  // early on to hold the bend at its clamp rather than easing through it.
  entrySpin: 9.4,
  entrySpinDuration: 2400,
  // Bézier handles, same sense as focusEaseIn/Out: a low in and a high out
  // means it picks up quickly and spends most of the duration gliding down.
  entryEaseIn: 0.29,
  entryEaseOut: 0.94,

  // Print on a card that has arrived but not yet settled — the same poster as
  // the other three dithers, keyed to how far through its own arrival the card
  // is. Kept modest: the reveal is what carries the effect, this is what stops
  // an arrived card from snapping straight to a clean photograph.
  entryDither: 0.45,
  entryDitherLevels: 4,
  entryDitherDissolve: 1.0,
  entryDitherInk: "#000000",
  entryDitherAccent: "#ffffff",
  entryDitherPaper: "#000000",
  entryDitherGamma: 1.5,
  entryDitherMono: 0.25,

  // Hover — rack focus. The card you point at reads clean while the rest
  // recede: dimmed, blurred and dithered, each on their own settings.
  hoverInEase: 0.095,
  hoverOutEase: 0.07,
  hoverCurve: 0.95,
  dimFade: 0.67,
  // How completely the hovered card is exempt from the frame-edge treatment.
  // That's all driven by screen position, so at 0 a hovered card near the top
  // or bottom stays smeared and screen-printed.
  hoverClean: 1.0,
  // A fast sweep drags the cursor over card after card, and taking each one as
  // a hover makes the rack focus blink on and off in its wake. With this on,
  // hover only changes hands once the pointer slows to the speed of aiming.
  hoverIntent: true,
  hoverSettleSpeed: 8,
  // Slots over which dimming ramps from none to full. Below 1 is hard
  // isolation; raise it to keep neighbours legible.
  focusFalloff: 0.7,

  // Hover blur — separate from the atmospheric one. Kept low, since the dither
  // carries most of the recession and softening under it just muddies grain.
  hoverBlur: 0.13,
  hoverBlurCurve: 1.0,

  // Hover dither
  hoverDither: 0.3,
  hoverDitherCurve: 1.9,
  hoverDitherLevels: 8,
  hoverDitherScale: 10,
  // Where the fade-out ends. Dim eases out exponentially so it never really
  // reaches zero, which leaves a few cells hanging around long after the rest
  // of the pattern has gone. Drop to 0 for that asymptotic tail.
  hoverDitherCutoff: 0.22,
  hoverDitherInk: "#000000",
  hoverDitherAccent: "#ffffff",
  hoverDitherPaper: "#000000",
  hoverDitherGamma: 1.8,
  hoverDitherMono: 0.22,

  // Click a card to bring it to the focus band. clickSlop is how far the
  // pointer may travel and still count as a click rather than a drag.
  clickToFocus: true,
  clickSlop: 6,
  // A real duration, not a lerp rate, so the move takes the same time whether
  // it crosses one slot or six.
  focusDuration: 1300,
  // Bézier handles. focusEaseOut is the one that matters on arrival: higher
  // stretches the deceleration so it glides in instead of stopping dead.
  focusEaseIn: 0.35,
  focusEaseOut: 0.98,

  cardBufferScale: 0.5,

  // Motion bend — cards flex as the helix turns. The modes differ in which axis
  // the falloff runs along, not in direction of travel:
  //   vertical   = falloff across the WIDTH, left/right ends bow up and down
  //   horizontal = falloff across the HEIGHT, top/bottom edges swing sideways
  bend: 2.7,
  bendMode: "horizontal",
  bendEase: 0.12,
  bendMaxVelocity: 0.07,

  // Edge treatment. focusSize holds a crisp band through the middle of the
  // frame before the streak starts; at 0 nothing is ever fully sharp.
  focusSize: 0.25,
  edgePower: 1.65,
  blurStrength: 0.47,
  streakAngle: 90,
  streakSpread: 4.5,
  // 0 = no perpendicular blur at all, a pure 1D smear along streakAngle.
  streakAnisotropy: 0,

  // Dissolve staging — makes the streak and the dither two phases of one
  // progression rather than two ramps that happen to overlap. 0 is loose,
  // 1 stages them fully. Held part-way so the streak keeps some of its own
  // reach past the hand-off.
  coupling: 0.55,
  stageStreakEnd: 0.55,
  // Below stageStreakEnd, so the two overlap while the streak is at its peak.
  // That overlap is what makes the hand-off feel continuous instead of like one
  // effect stopping and another starting.
  stageDitherBegin: 0.45,
  // How much ground the streak gives up as the dither rises. 1 = the extreme is
  // pure grain, 0 = the streak holds underneath and they stack.
  stageHandoff: 0.75,

  // Frame-edge dither. `dither` is the master switch, so intensity survives
  // toggling it off and on.
  dither: true,
  ditherAmount: 0.77,
  // Late and shallow: starts well past halfway, then comes in almost linearly.
  // A steep curve made the pattern arrive as an event; this lets it grow with
  // the recession instead.
  ditherStart: 0.64,
  ditherPower: 1.25,
  // How strongly recession triggers dither on its own, independent of screen
  // position. At full the far side of the helix carries grain without needing
  // to reach the frame edge.
  ditherDepth: 1.0,
  // Cell size in device pixels. Drives the Bayer grid and the snap of the
  // colour underneath, so a cell fills flat.
  ditherScale: 7.5,
  // Tones, ramped from centre to frame edge. Held equal so the palette stays
  // put as the dissolve deepens and only its coverage grows.
  maxLevels: 8,
  minLevels: 8,
  fadeStrength: 0.4,

  // A band rather than a dark-to-light ramp: ink and paper are both black, so
  // shadows and highlights drop out together and only the midtones lift to the
  // accent. That's what keeps it reading as grain instead of posterisation.
  ditherInk: "#000000",
  ditherAccent: "#ffffff",
  ditherPaper: "#000000",
  // Above 1 pushes midtones down the ramp, thinning the grain.
  ditherGamma: 1.8,
  // 0 keeps the image's own hues, quantized per channel. 1 is the full band.
  ditherMono: 0.22,
  // 0 cross-fades the dither in, 1 flips each cell on its own against the Bayer
  // threshold so the image breaks apart into the pattern.
  ditherDissolve: 0,

  // Cursor trail — a third dither, driven by where the pointer has been rather
  // than by screen position or hover. Its buffer remembers, so the pattern
  // follows the cursor and decays behind it.
  trail: true,
  // CSS pixels, so the brush is the same physical size on any screen.
  trailRadius: 132,
  // At 1 a parked cursor paints nothing and the trail decays out. At 0 the
  // brush ignores speed and paints full size wherever the pointer sits.
  trailSpeedInfluence: 1,
  // Speed (px/frame) counting as full for the above. Under hoverSettleSpeed on
  // purpose: by the time the pointer is fast enough for hover intent to call it
  // a sweep, the brush is already at full size, so the two hand off cleanly.
  trailSpeedRange: 6,
  trailDecay: 0.962,
  // How far each frame's blur pushes the trail outward, so it dissolves as it
  // fades rather than only dimming in place.
  trailDissipate: 1.6,
  trailSmoothing: 0.24,
  // Stillness (ms) counting as stopped. Past it the brush stops painting and
  // the buffer clears at trailIdleDecay. Long enough not to fire during a pause
  // mid-gesture.
  trailIdleDelay: 220,
  // Much steeper than trailDecay — that's what gives the trail a definite end
  // instead of a smear that sits there after you stop.
  trailIdleDecay: 0.869,
  // Drifts a virtual cursor when the pointer has been still, so the effect is
  // visible on load and on touch devices.
  trailIdleDrift: false,

  trailAmount: 0.78,
  // Floors the faint tail of the mask to zero. Without it the lowest Bayer
  // thresholds fire on residue and scatter stray cells outside the trail.
  trailCutoff: 0.125,
  // Warp runs well past the standing effects. It's the only one keyed to
  // direction of travel, so it's what makes the trail read as the surface being
  // dragged rather than another patch of grain.
  trailWarp: 0.36,
  trailAberration: 0,
  trailContrast: 0.77,
  trailScale: 8.5,
  // Coarser than the standing dithers at 8 — the trail is momentary, so it
  // wants to read at a glance.
  trailLevels: 6,
  // Hard by default. Breaking apart is the character of this one, even while
  // the other two cross-fade.
  trailDissolve: 1.0,
  // Ink lifted off true black, unlike the standing palettes. The trail draws on
  // top of them, so its darkest tone sitting slightly above the background is
  // what keeps the stroke legible over empty space.
  trailInk: "#1a1a1a",
  trailAccent: "#ffffff",
  trailPaper: "#000000",
  trailGamma: 2.0,
  trailMono: 0.29,
  trailRim: 0,
  trailRimColor: "#ffffff",
  trailRimThickness: 0.3,
  trailRimSoftness: 0.45,

  background: "#000000",
};

import img1 from '../assets/cards/1.jpg';
import img2 from '../assets/cards/2.jpg';
import img3 from '../assets/cards/3.jpg';
import img4 from '../assets/cards/4.jpg';
import img5 from '../assets/cards/5.jpg';
import img6 from '../assets/cards/6.jpg';

export const PROJECTS = [
  { id: "p1", title: "Pacekeeper", category: "Fitness Tracking" },
  { id: "p2", title: "Nocturne Radio", category: "Streaming Audio" },
  { id: "p3", title: "Aurelia Objects", category: "3D Graphics" },
  { id: "p4", title: "Granite Capital", category: "Fintech Web" },
  { id: "p5", title: "Encore Live", category: "Event Management" },
  { id: "p6", title: "Turfline", category: "Logistics Dashboard" }
];

// Switch the hardcoded strings to your imported asset modules!
export const IMAGES = [img1, img2, img3, img4, img5, img6];
