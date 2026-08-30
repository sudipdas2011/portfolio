export const config = {
  radius: 3.8,
  pitch: 1.27,
  angleStep: 0.8,
  curve: 1.0,
  cardWidth: 3.2,
  cardHeight: 1.6,
  shingle: 0.055,
  backfaceFade: 0,

  fogNear: 8.0,
  fogFar: 20.6,
  fogStrength: 1.0,
  depthBlur: 1.0,
  lift: 0,

  cameraZ: 10,
  fov: 48,

  wheelStrength: 0.0022,
  dragStrength: 0.007,
  ease: 0.075,
  autoSpin: 0.0,

  snap: true,
  snapSpeed: 0.02,
  snapDelay: 300,
  snapStiffness: 0.04,
  snapDamping: 0.54,

  entry: true,
  entryDuration: 1050,
  entryStagger: 60,
  entryCurve: 1.0,
  entrySoftness: 0.45,
  entryScale: 9.5,
  entryRound: 1,

  entrySpin: 9.4,
  entrySpinDuration: 2400,
  entryEaseIn: 0.29,
  entryEaseOut: 0.94,

  entryDither: 0.45,
  entryDitherLevels: 4,
  entryDitherDissolve: 1.0,
  entryDitherInk: "#000000",
  entryDitherAccent: "#ffffff",
  entryDitherPaper: "#000000",
  entryDitherGamma: 1.5,
  entryDitherMono: 0.25,

  hoverInEase: 0.095,
  hoverOutEase: 0.07,
  hoverCurve: 0.95,
  dimFade: 0.67,
  hoverClean: 1.0,
  hoverIntent: true,
  hoverSettleSpeed: 8,
  focusFalloff: 0.7,

  hoverBlur: 0.13,
  hoverBlurCurve: 1.0,

  hoverDither: 0.3,
  hoverDitherCurve: 1.9,
  hoverDitherLevels: 8,
  hoverDitherScale: 10,
  hoverDitherCutoff: 0.22,
  hoverDitherInk: "#000000",
  hoverDitherAccent: "#ffffff",
  hoverDitherPaper: "#000000",
  hoverDitherGamma: 1.8,
  hoverDitherMono: 0.22,

  clickToFocus: true,
  clickSlop: 6,
  focusDuration: 1300,
  focusEaseIn: 0.35,
  focusEaseOut: 0.98,

  cardBufferScale: 0.5,

  bend: 2.7,
  bendMode: "horizontal",
  bendEase: 0.12,
  bendMaxVelocity: 0.07,

  focusSize: 0.25,
  edgePower: 1.65,
  blurStrength: 0.47,
  streakAngle: 90,
  streakSpread: 4.5,
  streakAnisotropy: 0,

  coupling: 0.55,
  stageStreakEnd: 0.55,
  stageDitherBegin: 0.45,
  stageHandoff: 0.75,

  dither: true,
  ditherAmount: 0.77,
  ditherStart: 0.64,
  ditherPower: 1.25,
  ditherDepth: 1.0,
  ditherScale: 7.5,
  maxLevels: 8,
  minLevels: 8,
  fadeStrength: 0.4,

  ditherInk: "#000000",
  ditherAccent: "#ffffff",
  ditherPaper: "#000000",
  ditherGamma: 1.8,
  ditherMono: 0.22,
  ditherDissolve: 0,

  trail: true,
  trailRadius: 132,
  trailSpeedInfluence: 1,
  trailSpeedRange: 6,
  trailDecay: 0.962,
  trailDissipate: 1.6,
  trailSmoothing: 0.24,
  trailIdleDelay: 220,
  trailIdleDecay: 0.869,
  trailIdleDrift: false,

  trailAmount: 0.78,
  trailCutoff: 0.125,
  trailWarp: 0.36,
  trailAberration: 0,
  trailContrast: 0.77,
  trailScale: 8.5,
  trailLevels: 6,
  trailDissolve: 1.0,
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

import img1 from '../assets/3.webp';
import img2 from '../assets/10.webp';
import img3 from '../assets/13.webp';
import img4 from '../assets/14.webp';
import img5 from '../assets/15.webp';
import img6 from '../assets/17.webp';

export const PROJECTS = [
  { id: "p1", title: "Pacekeeper", category: "Fitness Tracking" },
  { id: "p2", title: "Nocturne Radio", category: "Streaming Audio" },
  { id: "p3", title: "Aurelia Objects", category: "3D Graphics" },
  { id: "p4", title: "Granite Capital", category: "Fintech Web" },
  { id: "p5", title: "Encore Live", category: "Event Management" },
  { id: "p6", title: "Turfline", category: "Logistics Dashboard" }
];

export const IMAGES = [img1, img2, img3, img4, img5, img6];
