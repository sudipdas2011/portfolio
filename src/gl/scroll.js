function bezier(t, x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  const sampleX = (u) => ((ax * u + bx) * u + cx) * u;
  const slopeX = (u) => (3 * ax * u + 2 * bx) * u + cx;

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
  let snapTarget = null;
  let lastInput = -Infinity;
  let tween = null;

  const PAGE_SCROLL_MULTIPLIER = 2.5;

  let wheelDistance = 0;
  let wheelDirection = 0;

  const getRequiredWheelDistance = () => {
    return window.innerHeight * PAGE_SCROLL_MULTIPLIER;
  };

  const resetWheelLock = () => {
    wheelDistance = 0;
    wheelDirection = 0;
  };

  const noteInput = () => {
    lastInput = performance.now();
    snapTarget = null;
  };

  const interrupt = () => {
    tween = null;
    noteInput();
  };

  /*
   * ---------------------------------------------------------
   * WHEEL
   * ---------------------------------------------------------
   */
  const onWheel = (e) => {
    const deltaY = e.deltaY;

    if (deltaY === 0) return;

    const direction = deltaY > 0 ? 1 : -1;

    if (
      wheelDirection !== 0 &&
      direction !== wheelDirection
    ) {
      resetWheelLock();
    }

    wheelDirection = direction;

    const requiredDistance =
      getRequiredWheelDistance();

    if (wheelDistance >= requiredDistance) {
      resetWheelLock();

      return;
    }

    e.preventDefault();

    state.target +=
      deltaY * config.wheelStrength;

    wheelDistance += Math.abs(deltaY);

    interrupt();
  };

  const onPointerDown = (e) => {
    dragging = true;

    interrupt();

    lastPointerY = e.clientY;

    element.setPointerCapture?.(
      e.pointerId
    );
  };

  const onPointerMove = (e) => {
    if (!dragging) return;

    const delta =
      e.clientY - lastPointerY;

    lastPointerY = e.clientY;

    state.target -=
      delta * config.dragStrength;

    interrupt();
  };

  const onPointerUp = (e) => {
    dragging = false;

    element.releasePointerCapture?.(
      e.pointerId
    );
  };

  element.addEventListener(
    "wheel",
    onWheel,
    {
      passive: false,
    }
  );

  element.addEventListener(
    "pointerdown",
    onPointerDown
  );

  window.addEventListener(
    "pointermove",
    onPointerMove
  );

  window.addEventListener(
    "pointerup",
    onPointerUp
  );

  element.style.touchAction = "none";

  return {
    state,

    resetWheelLock,

    getWheelDistance() {
      return wheelDistance;
    },

    getWheelProgress() {
      const required =
        getRequiredWheelDistance();

      if (required <= 0) return 1;

      return Math.min(
        1,
        wheelDistance / required
      );
    },

    goTo(value, options = {}) {
      tween = {
        from: state.current,
        to: value,
        start: performance.now(),
        duration: Math.max(
          1,
          options.duration ??
            config.focusDuration
        ),
        easeIn:
          options.easeIn ??
          config.focusEaseIn,
        easeOut:
          options.easeOut ??
          config.focusEaseOut,
      };

      state.target = value;

      noteInput();
    },

    update() {
      const previous =
        state.current;

      if (tween) {
        const t = Math.min(
          1,
          (performance.now() -
            tween.start) /
            tween.duration
        );

        const eased = bezier(
          t,
          tween.easeIn,
          0,
          1 - tween.easeOut,
          1
        );

        state.current =
          tween.from +
          (tween.to - tween.from) *
            eased;

        state.target =
          tween.to;

        state.snapping = false;
        state.snapVelocity = 0;
        snapTarget = null;

        if (t >= 1) {
          tween = null;
        }

        state.velocity =
          state.current -
          previous;

        const held = Math.max(
          -config.bendMaxVelocity,
          Math.min(
            config.bendMaxVelocity,
            state.velocity
          )
        );

        state.bendVelocity +=
          (held -
            state.bendVelocity) *
          config.bendEase;

        return state.current;
      }

      const quiet =
        performance.now() -
          lastInput >
        config.snapDelay;

      const stopped =
        Math.abs(state.velocity) <
        config.snapSpeed;

      state.snapping =
        config.snap &&
        !dragging &&
        !config.autoSpin &&
        quiet &&
        (state.snapping ||
          stopped);

      if (state.snapping) {
        if (snapTarget === null) {
          snapTarget =
            Math.round(
              state.target
            );

          state.snapVelocity =
            state.velocity;

          state.target =
            snapTarget;
        }

        state.snapVelocity +=
          (snapTarget -
            state.current) *
          config.snapStiffness;

        state.snapVelocity *=
          config.snapDamping;

        state.current +=
          state.snapVelocity;
      } else {
        snapTarget = null;

        state.snapVelocity = 0;

        state.current +=
          (state.target -
            state.current) *
          config.ease;
      }

      state.velocity =
        state.current -
        previous;

      const capped =
        Math.max(
          -config.bendMaxVelocity,
          Math.min(
            config.bendMaxVelocity,
            state.velocity
          )
        );

      state.bendVelocity +=
        (capped -
          state.bendVelocity) *
        config.bendEase;

      return state.current;
    },

    dispose() {
      element.removeEventListener(
        "wheel",
        onWheel
      );

      element.removeEventListener(
        "pointerdown",
        onPointerDown
      );

      window.removeEventListener(
        "pointermove",
        onPointerMove
      );

      window.removeEventListener(
        "pointerup",
        onPointerUp
      );
    },
  };
}