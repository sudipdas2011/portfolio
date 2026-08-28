// Cards are patches of the helix cylinder surface, not flat quads. The vertex
// shader bends each subdivided plane onto the cylinder radius so its left and
// right edges recede in Z while the centre faces the camera.

import { bayerGLSL, revealGLSL } from "./dither.js";

export const cardVertex = /* glsl */ `
  uniform float uProgress;
  uniform float uIndex;
  uniform float uCount;
  uniform float uRadius;
  uniform float uPitch;
  uniform float uAngleStep;
  uniform float uCurve;
  uniform float uShingle;
  uniform float uVelocity;
  uniform float uBend;
  uniform float uBendVertical;
  uniform float uBendHorizontal;
  uniform float uHover;

  varying vec2 vUv;
  varying float vFacing;
  varying float vSlot;
  varying float vDepth;

  void main() {
    vUv = uv;

    // Slot in the loop. The wrap is invisible because it happens inside the
    // max-dither zone at the top and bottom of the frame.
    float slot = mod(uIndex - uProgress, uCount);
    vSlot = slot / uCount;

    float baseAngle = (slot - uCount * 0.5) * uAngleStep;
    float baseY     = (slot - uCount * 0.5) * uPitch;

    // Motion bend. As the helix turns, a card's ends lag behind its centre as
    // if it had some give, bowing the plane into a C that opens against the
    // direction of travel. The lag is applied along the card's actual path,
    // both around the axis and up it, so the deflection follows the helix
    // rather than looking like a seperate wobble. Quadratic falloff pins the
    // centre and eases outward so the ends stay soft instead of creasing.
    float tx = (uv.x - 0.5) * 2.0;
    float ty = (uv.y - 0.5) * 2.0;

    // Vertical mode: falloff runs across the WIDTH, so the left and right ends
    // lag along the helix rise and the plane bows into a smile or a frown.
    // The angular term is weighted well down on purpose — an angle offset that
    // varies across the width widens the card's arc, so at full strength it
    // stretches the plane into a ribbon instead of bending it.
    float lagV = uVelocity * uBend * tx * tx * uBendVertical;
    baseAngle += lagV * uAngleStep * 0.35;
    baseY     += lagV * uPitch;

    // Horizontal mode: falloff runs across the HEIGHT instead, so the top and
    // bottom edges swing sideways around the axis while the middle holds — the
    // same C turned ninety degrees. An angle offset varying down the height
    // shifts each row bodily without changing its width, so unlike the vertical
    // term this one can't stretch the card. Halved so a given bend amount
    // deflects about as far as it does in vertical mode; angular offset also
    // carries rows around the cylinder in Z, which compounds it, and unscaled
    // this mode folds cards into crescents at settings vertical handles fine.
    float lagH = uVelocity * uBend * ty * ty * uBendHorizontal;
    baseAngle += lagH * uAngleStep * 0.5;

    // Cards overlap their neighbours in both angle and height, so putting them
    // all on one radius makes the overlaps exactly coplanar and they z-fight.
    // Stepping the radius per slot breaks the tie and shingles them in order.
    float r = uRadius + slot * uShingle;

    // Arc length along the card maps to angle around the axis.
    float theta = baseAngle + (position.x / r) * uCurve;

    // uCurve blends fully-wrapped arc (1.0) against a flat tangent chord (0.0).
    vec3 curved = vec3(sin(theta) * r, 0.0, cos(theta) * r);
    vec3 flat_ = vec3(
      sin(baseAngle) * r + cos(baseAngle) * position.x,
      0.0,
      cos(baseAngle) * r - sin(baseAngle) * position.x
    );

    vec3 p = mix(flat_, curved, uCurve);
    p.y = position.y + baseY;

    // Cards on the far side of the cylinder fade out.
    vFacing = cos(baseAngle) * 0.5 + 0.5;

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    vDepth = -viewPosition.z;

    gl_Position = projectionMatrix * viewPosition;
  }
`;

export const cardFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uImageRatio;
  uniform float uBackfaceFade;
  uniform vec3 uBackground;
  uniform float uFogNear;
  uniform float uFogFar;
  uniform float uFogStrength;
  uniform float uHover;
  uniform float uDim;
  uniform float uDimFade;

  varying vec2 vUv;
  varying float vFacing;
  varying float vDepth;

  ${bayerGLSL}
  ${revealGLSL}

  void main() {
    // Discarded rather than blended toward the background, because a card that
    // hasn't arrived isn't a faint card — it isn't there. Blending would leave
    // its light in the scene target for the blur chain to smear into streaks
    // across the frame, and hold the card in front of the ones behind it.
    if (entryHidden(vUv)) discard;

    // Cover-fit the texture inside the card.
    vec2 uv = (vUv - 0.5) * uImageRatio + 0.5;
    vec4 tex = texture2D(uMap, uv);

    // Hover overrides the backface fade too, or pointing at a card on the far
    // side of the helix would resolve something still 90% erased.
    float fade = mix(1.0, smoothstep(0.0, 0.55, vFacing), uBackfaceFade * (1.0 - uHover));

    // Blend toward the background instead of using alpha. Cards overlap heavily
    // on the helix and transparent sorting would thrash — and anything a faded
    // card could reveal is already depth-occluded by the one in front.
    vec3 color = mix(uBackground, tex.rgb, tex.a * fade);

    // Atmospheric perspective. Contrast falls off with distance so far cards
    // sit back in the haze rather than reading as equally-present cards that
    // just happen to be smaller. Hover lifts a card out of it, so the one you
    // point at reads clean whatever depth it sits at.
    float fog = smoothstep(uFogNear, uFogFar, vDepth) * (1.0 - uHover);
    color = mix(color, uBackground, fog * uFogStrength);

    // Rack focus: while any card is hovered the rest drop in brightness. Gamma
    // corrected because this shader works in linear light, where a straight 0.5
    // mix only reads as about a 27% drop on screen. The 2.2 makes the control
    // perceptual, so 0.5 looks half as bright instead of merely measuring half
    // the photons.
    float dimAmount = 1.0 - pow(1.0 - uDim * uDimFade, 2.2);
    color = mix(color, uBackground, dimAmount);

    // Alpha carries nearness, not opacity. The composite reads it to decide how
    // far up the blur chain each pixel goes, so distance softens focus the way
    // haze does. Stored inverted (1 = near) so empty background, which clears
    // to alpha 1, counts as near and stays sharp — storing depth directly would
    // need a 0 clear alpha, and three premultiplies the clear colour by it,
    // which turns a white background black.
    //
    // Dimming deliberately isn't folded in here. It travels in the card
    // buffer's green channel instead, so the composite can tell "dimmed" from
    // "far" and give hover its own blur and dither settings.
    gl_FragColor = vec4(color, 1.0 - fog);
  }
`;
