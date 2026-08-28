// Wheel, drag and touch all funnel into one number. The page itself never
// scrolls — `current` chases `target` with a lerp for the inertia feel.

// Cubic Bézier easing, the same curve CSS timing functions use. Replaced a
// symmetric power ease, which couldn't decelerate for longer than it
// accelerated — the tail was always as short as the run-up, so the arrival read
// as a cut no matter how high the exponent went.
//
// Endpoints are pinned at (0,0) and (1,1) with both handles at y = 0 and y = 1,
// which forces zero velocity at each end. Start and stop stay smooth however
// the handles move along x.
function bezier(t, x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (u) => ((ax * u + bx) * u + cx) * u;
  const slopeX = (u) => (3 * ax * u + 2 * bx) * u + cx;

  // The curve is parameterised by u, not by time, so solve x(u) = t first.
  let u = t;
  for (let i = 0; i < 6; i++) {
    const dx = sampleX(u) - t;
    if (Math.abs(dx) < 1e-5) break;
    const slope = slopeX(u);
    if (Math.abs(slope) < 1e-6) break;
    u -= dx / slope;
  }

  return ((ay * u + by) * u + cy) * u;
}

export function createScrollController(element, config) {
  const state = {
    target: 0,
    current: 0,
    velocity: 0,
    bendVelocity: 0,
    snapVelocity: 0,
    snapping: false,
  };

  let dragging = false;
  let lastPointerY = 0;
  // Held once chosen so the destination cannot flip between two cards while
  // the spring is still travelling toward it.
  let snapTarget = null;
  let lastInput = -Infinity;
  // Click-to-centre runs as a timed tween rather than through the lerp, because
  // a lerp has a rate but no duration — fastest at the start, crawling at the
  // end, which reads as arriving twice.
  let tween = null;

  const noteInput = () => {
    lastInput = performance.now();
    snapTarget = null;
  };

  // Any real input abandons the tween so the carousel never fights the user.
  const interrupt = () => {
    tween = null;
    noteInput();
  };

  const onWheel = (e) => {
    e.preventDefault();
    state.target += e.deltaY * config.wheelStrength;
    interrupt();
  };

  const onPointerDown = (e) => {
    dragging = true;
    interrupt();
    lastPointerY = e.clientY;
    element.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const delta = e.clientY - lastPointerY;
    lastPointerY = e.clientY;
    state.target -= delta * config.dragStrength;
    interrupt();
  };

  const onPointerUp = (e) => {
    dragging = false;
    element.releasePointerCapture?.(e.pointerId);
  };

  element.addEventListener("wheel", onWheel, { passive: false });
  element.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  element.style.touchAction = "none";

  return {
    state,
    // Drive the carousel somewhere from outside, as a timed eased tween.
    // Counts as input so the snap holds off and lets the travel play out
    // instead of engaging mid-flight and hauling it back where it started.
    //
    // The duration and handles are copied onto the tween rather than read from
    // config each frame, so callers with their own timing — the entry spin —
    // don't have to borrow the click-to-centre ones.
    goTo(value, options = {}) {
      tween = {
        from: state.current,
        to: value,
        start: performance.now(),
        duration: Math.max(1, options.duration ?? config.focusDuration),
        easeIn: options.easeIn ?? config.focusEaseIn,
        easeOut: options.easeOut ?? config.focusEaseOut,
      };
      state.target = value;
      noteInput();
    },
    update() {
      const previous = state.current;

      if (tween) {
        const t = Math.min(1, (performance.now() - tween.start) / tween.duration);
        // Handles ride along x only. Pushing the ease-out up pulls the second
        // handle toward the start, which stretches the deceleration over more
        // of the duration — that is the knob for how long it glides in.
        const eased = bezier(t, tween.easeIn, 0, 1 - tween.easeOut, 1);
        state.current = tween.from + (tween.to - tween.from) * eased;
        state.target = tween.to;

        // Snap is held off for the whole tween. It would otherwise engage
        // partway — the tween moves slowly enough near the ends to look
        // stopped — and fight the curve. Nothing is lost by skipping it, since
        // the tween lands on a whole slot by construction.
        state.snapping = false;
        state.snapVelocity = 0;
        snapTarget = null;

        if (t >= 1) tween = null;

        state.velocity = state.current - previous;
        const held = Math.max(
          -config.bendMaxVelocity,
          Math.min(config.bendMaxVelocity, state.velocity)
        );
        state.bendVelocity += (held - state.bendVelocity) * config.bendEase;
        return state.current;
      }

      // Engages on speed plus quiet time, not distance-to-target. Gating on
      // distance meant any input smaller than the threshold stayed inside the
      // settling band and got absorbed by the spring before it could
      // accumulate, so gentle scrolling did nothing at all. Requiring a quiet
      // period instead means any input releases the snap immediately and normal
      // drift takes over. autoSpin is excluded — it feeds target every frame
      // and the spring would just fight it forever.
      const quiet = performance.now() - lastInput > config.snapDelay;
      const stopped = Math.abs(state.velocity) < config.snapSpeed;
      // Latched — once engaged it stays engaged until an input releases it.
      // Re-testing speed every frame made it drop out the moment the spring
      // picked up pace, then re-engage against a partly-travelled position and
      // round to the wrong card.
      state.snapping =
        config.snap &&
        !dragging &&
        !config.autoSpin &&
        quiet &&
        (state.snapping || stopped);

      if (state.snapping) {
        if (snapTarget === null) {
          // Progress is measured in slots and a card sits dead centre at every
          // whole number, so the nearest integer is the nearest card. Rounded
          // from target rather than current: the drift is usually still in
          // flight when this engages, and rounding where it happens to have
          // reached would cancel a move the user clearly asked for.
          snapTarget = Math.round(state.target);
          // Inherit the drift's velocity so the handoff is continuous rather
          // than a visible change of gear.
          state.snapVelocity = state.velocity;
          // Moved to the destination once, here — never per frame. Writing
          // current into target every frame destroyed the pending input, so a
          // gesture that had asked for the next card ended up rounding back to
          // the one it started on.
          state.target = snapTarget;
        }
        state.snapVelocity +=
          (snapTarget - state.current) * config.snapStiffness;
        state.snapVelocity *= config.snapDamping;
        state.current += state.snapVelocity;
      } else {
        snapTarget = null;
        state.snapVelocity = 0;
        state.current += (state.target - state.current) * config.ease;
      }

      state.velocity = state.current - previous;

      // The bend runs off its own damped, clamped copy of velocity. Raw
      // per-frame velocity is spiky enough to make the cards snap, and an
      // unclamped flick would fold them inside out.
      const capped = Math.max(
        -config.bendMaxVelocity,
        Math.min(config.bendMaxVelocity, state.velocity)
      );
      state.bendVelocity += (capped - state.bendVelocity) * config.bendEase;

      return state.current;
    },
    dispose() {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    },
  };
}
