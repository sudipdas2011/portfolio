import React, { useEffect, useRef, useState } from "react";
import TextRise from "../components/TextRise";


export default function Contact() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);

  const [startAnimation, setStartAnimation] = useState(false);
  const [startSimulation, setStartSimulation] = useState(false);

  const hasStarted = useRef(false);

  /*
   * Match this with your TextRise total animation duration.
   */
  const TEXT_RISE_DURATION = 1600;

  // =========================================================
  // CONTACT ACTIVATION
  // =========================================================

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.intersectionRatio >= 0.85 &&
          !hasStarted.current
        ) {
          hasStarted.current = true;

          setStartAnimation(true);

          setTimeout(() => {
            setStartSimulation(true);
          }, TEXT_RISE_DURATION);
        }
      },
      {
        threshold: [0, 0.85, 1],
      }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  // =========================================================
  // FLUID SIMULATION
  // =========================================================

  useEffect(() => {
    if (!startSimulation) return;

    const canvas = canvasRef.current;
    const section = sectionRef.current;

    if (!canvas || !section) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let animationFrame = 0;

    // =======================================================
    // MOUSE
    // =======================================================

    const mouse = {
      x: -1000,
      y: -1000,

      velocityX: 0,
      velocityY: 0,

      speed: 0,
      force: 0,

      active: false,
    };

    const updateMouse = (event) => {
      const rect =
        canvas.getBoundingClientRect();

      const x =
        event.clientX -
        rect.left;

      const y =
        event.clientY -
        rect.top;

      /*
       * Avoid giant impulse on the first mouse event.
       */
      if (mouse.x < -500) {
        mouse.x = x;
        mouse.y = y;
        mouse.velocityX = 0;
        mouse.velocityY = 0;
        mouse.speed = 0;
        mouse.force = 0;
        mouse.active = true;
        return;
      }

      const dx =
        x - mouse.x;

      const dy =
        y - mouse.y;

      mouse.x = x;
      mouse.y = y;

      mouse.velocityX = dx;
      mouse.velocityY = dy;

      mouse.speed =
        Math.sqrt(
          dx * dx +
            dy * dy
        );

      /*
       * Force is purely movement-driven.
       */
      mouse.force =
        Math.min(
          1,
          mouse.speed / 14
        );

      mouse.active = true;
    };

    const leaveMouse = () => {
      mouse.active = false;

      mouse.velocityX = 0;
      mouse.velocityY = 0;
      mouse.speed = 0;
      mouse.force = 0;
    };

    section.addEventListener(
      "mousemove",
      updateMouse,
      { passive: true }
    );

    section.addEventListener(
      "mouseleave",
      leaveMouse
    );

    // =======================================================
    // RESIZE
    // =======================================================

    const resize = () => {
      const rect =
        section.getBoundingClientRect();

      width = rect.width;
      height = rect.height;

      const dpr =
        Math.min(
          window.devicePixelRatio || 1,
          2
        );

      canvas.width =
        width * dpr;

      canvas.height =
        height * dpr;

      canvas.style.width =
        `${width}px`;

      canvas.style.height =
        `${height}px`;

      ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );
    };

    resize();

    const resizeObserver =
      new ResizeObserver(resize);

    resizeObserver.observe(section);

    // =======================================================
    // CONFIG
    // =======================================================

    const TYPES = [
      "square",
      "rectangle",
      "circle",
      "triangle",
      "diamond",
      "cross",
    ];

    /*
     * Original requested scale.
     */
    const SIZE_MULTIPLIER = 0.35;

    /*
     * Downward gravity.
     */
    const GRAVITY = 0.18;

    /*
     * Pointer field.
     */
    const MOUSE_RADIUS = 150;

    /*
     * Smooth fluid flow.
     */
    const FLOW_STRENGTH = 0.00075;

    /*
     * Very slippery movement.
     */
    const VELOCITY_DAMPING = 0.999;

    /*
     * Long color memory.
     */
    const COLOR_DECAY = 0.988;

    /*
     * Bouncy but not cartoonishly explosive.
     */
    const GROUND_RESTITUTION = 0.78;
    const WALL_RESTITUTION = 0.82;
    const OBJECT_RESTITUTION = 0.78;

    /*
     * Almost frictionless.
     */
    const COLLISION_FRICTION = 0.002;

    /*
     * Mild liquid pressure.
     */
    const FLUID_PRESSURE = 0.005;

    /*
     * Startup stream width.
     *
     * Very thin.
     */
    const STREAM_WIDTH = 25;

    // =======================================================
    // GAUSSIAN RANDOM
    // =======================================================

    const gaussianRandom = () => {
      let u = 0;
      let v = 0;

      while (u === 0) {
        u = Math.random();
      }

      while (v === 0) {
        v = Math.random();
      }

      return (
        Math.sqrt(
          -2 *
            Math.log(u)
        ) *
        Math.cos(
          Math.PI *
            2 *
            v
        )
      );
    };

    // =======================================================
    // PARTICLE
    // =======================================================

    class Particle {
      constructor(index) {
        this.id = index;

        this.reset();
      }

      reset() {
        // ===================================================
        // THIN CENTER STREAM
        // ===================================================

        /*
         * Almost everything enters from a very narrow
         * vertical column directly above the center.
         */
        const streamOffset =
          gaussianRandom() *
          STREAM_WIDTH;

        this.x =
          width *
            0.5 +
          streamOffset;

        /*
         * Stagger objects through the entire height above
         * the viewport.
         */
        this.y =
          -100 -
          Math.random() *
            height *
            1.5;

        /*
         * Mostly vertical initial movement.
         */
        this.vx =
          streamOffset *
            0.012 +
          (Math.random() -
            0.5) *
            0.12;

        this.vy =
          1.0 +
          Math.random() *
            1.25;

        // ===================================================
        // SIZE
        // ===================================================

        this.size =
          (16 +
            Math.random() * 28) *
          SIZE_MULTIPLIER;

        /*
         * Collision radius is slightly larger than
         * visible radius to prevent intersections.
         */
        this.collisionRadius =
          this.size * 1.42;

        this.width =
          this.size *
          (1 +
            Math.random() *
              1.65);

        this.height =
          this.size *
          (0.85 +
            Math.random() *
              1.5);

        // ===================================================
        // MASS
        // ===================================================

        this.baseMass =
          Math.max(
            0.5,
            this.size *
              this.size
          );

        this.mass = this.baseMass;

        // ===================================================
        // GRAVITY
        // ===================================================

        this.gravity =
          GRAVITY *
          (0.9 +
            Math.random() *
              0.2);

        // ===================================================
        // BOUNCE
        // ===================================================

        this.restitution =
          0.72 +
          Math.random() *
            0.1;

        this.groundFriction =
          0.985 +
          Math.random() *
            0.01;

        // ===================================================
        // ROTATION
        // ===================================================

        this.rotation =
          Math.random() *
          Math.PI *
          2;

        /*
         * Start with very little angular velocity.
         */
        this.rotationVelocity =
          (Math.random() -
            0.5) *
          0.008;

        /*
         * Strong rotational damping.
         *
         * Objects naturally stop spinning.
         */
        this.angularDamping =
          0.92;

        /*
         * Maximum angular velocity.
         */
        this.maxAngularVelocity =
          0.055;

        // ===================================================
        // SHAPE
        // ===================================================

        this.type =
          TYPES[
            Math.floor(
              Math.random() *
                TYPES.length
            )
          ];

        // ===================================================
        // COLOR
        // ===================================================

        this.colorHue =
          Math.random() *
          360;

        this.colorEnergy = 0;

        // ---------------------------------------------------
        // PROXIMITY SCALE
        // ---------------------------------------------------

        /*
         * Smooth spring-driven scale.
         *
         * Far from pointer:
         *   scale -> 1
         *
         * Near pointer:
         *   scale -> larger
         *
         * The spring gives the scale a subtle bounce when
         * entering/leaving the pointer field.
         */
        this.scale = 1;
        this.collisionScale = 1;
        this.scaleVelocity = 0;
        this.targetScale = 1;

        // ===================================================
        // FLUID FIELD VARIATION
        // ===================================================

        this.flowOffset =
          Math.random() *
          1000;

        this.flowScale =
          0.8 +
          Math.random() *
            0.35;
      }

      // =====================================================
      // SMOOTH FLUID FIELD
      // =====================================================

      applyFluidField(time) {
        const t =
          time *
          0.00022;

        /*
         * Large slow-moving waves.
         *
         * Much less noisy than the previous version.
         */
        const waveA =
          Math.sin(
            this.y *
              0.0025 +
              t +
              this.flowOffset
          );

        const waveB =
          Math.cos(
            this.x *
              0.0022 -
              t *
                1.15
          );

        const waveC =
          Math.sin(
            (this.x +
              this.y) *
              0.0015 +
              t *
                0.6
          );

        /*
         * Large fluid current.
         */
        const flowX =
          waveA *
            0.7 +
          waveC *
            0.35;

        const flowY =
          waveB *
            0.48 -
          waveC *
            0.18;

        this.vx +=
          flowX *
          FLOW_STRENGTH *
          this.flowScale;

        this.vy +=
          flowY *
          FLOW_STRENGTH *
          0.4 *
          this.flowScale;

        /*
         * Very subtle sideways breathing.
         */
        this.vx +=
          Math.sin(
            this.y *
              0.004 +
              t
          ) *
          0.008;
      }

      // =====================================================
      // MOUSE DISTURBANCE
      // =====================================================

      applyMouseWave() {
        /*
         * Absolutely no movement:
         * absolutely no pointer force.
         */
        if (
          !mouse.active ||
          mouse.force <=
            0.001
        ) {
          return;
        }

        const dx =
          this.x -
          mouse.x;

        const dy =
          this.y -
          mouse.y;

        const distance =
          Math.sqrt(
            dx * dx +
              dy * dy
          ) || 0.001;

        if (
          distance >
          MOUSE_RADIUS
        ) {
          return;
        }

        /*
         * Proximity.
         */
        const proximity =
          1 -
          distance /
            MOUSE_RADIUS;

        /*
         * Smooth falloff.
         */
        const falloff =
          proximity *
          proximity *
          (3 -
            2 *
              proximity);

        /*
         * Movement-only input.
         */
        const force =
          falloff *
          mouse.force;

        const nx =
          dx /
          distance;

        const ny =
          dy /
          distance;

        // ===================================================
        // RADIAL WAVE
        // ===================================================

        const radial =
          force *
          3.5;

        this.vx +=
          nx *
          radial;

        this.vy +=
          ny *
          radial;

        // ===================================================
        // VELOCITY TRANSFER
        // ===================================================

        /*
         * Cursor carries the fluid in its direction.
         */
        this.vx +=
          mouse.velocityX *
          force *
          0.13;

        this.vy +=
          mouse.velocityY *
          force *
          0.13;

        // ===================================================
        // TANGENTIAL FLOW
        // ===================================================

        const tangentX =
          -ny;

        const tangentY =
          nx;

        const swirl =
          mouse.speed *
          force *
          0.045;

        this.vx +=
          tangentX *
          swirl;

        this.vy +=
          tangentY *
          swirl;

        // ===================================================
        // COLOR
        // ===================================================

        /*
         * Color reacts to proximity, not simply cursor speed.
         */
        this.colorEnergy =
          Math.min(
            1,
            this.colorEnergy +
              falloff *
                (0.1 +
                  mouse.force *
                    0.1)
          );
      }

      // =====================================================
      // PROXIMITY SCALE
      // =====================================================

      updateProximityScale() {
        let proximity = 0;

        if (mouse.active) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;

          const distance =
            Math.sqrt(dx * dx + dy * dy) || 0.001;

          if (distance < MOUSE_RADIUS) {
            const normalized =
              1 - distance / MOUSE_RADIUS;

            proximity =
              normalized * normalized *
              (3 - 2 * normalized);
          }
        }

        /*
         * Smooth proximity scale.
         *
         * No oscillating spring: the target is followed with a
         * frame-rate independent critically-damped response.
         */
        this.targetScale =
          1 + proximity * 0.72;

        const scaleResponse = 0.20;

        this.scale +=
          (this.targetScale - this.scale) *
          scaleResponse;

        this.scale = Math.max(
          1,
          Math.min(1.72, this.scale)
        );

        /*
         * Physics adapts more gently than the visual size.
         * Keeping this below the visual scale prevents the collision
         * boundary from rapidly expanding/contracting and pushing
         * neighboring particles back and forth.
         */
        const desiredCollisionScale =
          1 + (this.scale - 1) * 0.52;

        this.collisionScale +=
          (desiredCollisionScale - this.collisionScale) *
          0.10;

        this.collisionScale = Math.max(
          1,
          Math.min(1.38, this.collisionScale)
        );

        /*
         * IMPORTANT: mass stays constant.
         * Changing mass during proximity interactions was another
         * source of tiny collision impulses/jitter.
         */
        this.mass = this.baseMass;
      }

      // =====================================================
      // ROTATION STABILIZATION
      // =====================================================

      stabilizeRotation() {
        /*
         * Angular velocity loses energy naturally.
         */
        this.rotationVelocity *=
          this.angularDamping;

        /*
         * Slowly pull toward zero.
         *
         * This prevents endless spinning.
         */
        this.rotationVelocity *=
          0.965;

        /*
         * Clamp.
         */
        if (
          this.rotationVelocity >
          this.maxAngularVelocity
        ) {
          this.rotationVelocity =
            this.maxAngularVelocity;
        }

        if (
          this.rotationVelocity <
          -this.maxAngularVelocity
        ) {
          this.rotationVelocity =
            -this.maxAngularVelocity;
        }

        /*
         * Dead-zone.
         *
         * Once almost stopped, smoothly settle to zero.
         */
        if (
          Math.abs(
            this.rotationVelocity
          ) <
          0.0008
        ) {
          this.rotationVelocity =
            0;
        }

        this.rotation +=
          this.rotationVelocity;
      }

      // =====================================================
      // UPDATE
      // =====================================================

      update(time) {
        // ---------------------------------------------------
        // GRAVITY
        // ---------------------------------------------------

        this.vy +=
          this.gravity;

        // ---------------------------------------------------
        // FLUID
        // ---------------------------------------------------

        this.applyFluidField(
          time
        );

        // ---------------------------------------------------
        // MOUSE
        // ---------------------------------------------------

        this.applyMouseWave();

        // ---------------------------------------------------
        // LOW DRAG
        // ---------------------------------------------------

        this.vx *=
          VELOCITY_DAMPING;

        this.vy *=
          0.997;

        // ---------------------------------------------------
        // SPEED LIMIT
        // ---------------------------------------------------

        const speed =
          Math.sqrt(
            this.vx *
                this.vx +
              this.vy *
                this.vy
          );

        const maxSpeed =
          17;

        if (
          speed >
          maxSpeed
        ) {
          this.vx =
            (this.vx /
              speed) *
            maxSpeed;

          this.vy =
            (this.vy /
              speed) *
            maxSpeed;
        }

        // ---------------------------------------------------
        // POSITION
        // ---------------------------------------------------

        this.x +=
          this.vx;

        this.y +=
          this.vy;

        // ---------------------------------------------------
        // PROXIMITY SCALE
        // ---------------------------------------------------

        this.updateProximityScale();

        // ---------------------------------------------------
        // ROTATION
        // ---------------------------------------------------

        this.stabilizeRotation();

        // ===================================================
        // GROUND
        // ===================================================

        const effectiveRadius =
          this.collisionRadius *
          this.collisionScale;

        const ground =
          height -
          effectiveRadius -
          8;

        if (
          this.y >
          ground
        ) {
          this.y =
            ground;

          /*
           * Elastic impact.
           */
          this.vy *=
            -GROUND_RESTITUTION;

          /*
           * Extremely low sliding friction.
           */
          this.vx *=
            this.groundFriction;

          /*
           * Ground impact adds only a SMALL rotational kick.
           */
          this.rotationVelocity *= 0.985;

          /*
           * Allow tiny natural rebounds,
           * but don't create endless jitter.
           */
          if (
            Math.abs(
              this.vy
            ) <
            0.12
          ) {
            this.vy = 0;
          }
        } else {
          }

        // ===================================================
        // WALLS
        // ===================================================

        if (
          this.x <
          effectiveRadius
        ) {
          this.x =
            effectiveRadius;

          this.vx *=
            -WALL_RESTITUTION;

          this.rotationVelocity *= 0.985;
        }

        if (
          this.x >
          width -
            effectiveRadius
        ) {
          this.x =
            width -
            effectiveRadius;

          this.vx *=
            -WALL_RESTITUTION;

          this.rotationVelocity *= 0.985;
        }

        // ===================================================
        // COLOR
        // ===================================================

        this.colorEnergy *=
          COLOR_DECAY;

        if (
          this.colorEnergy <
          0.0005
        ) {
          this.colorEnergy = 0;
        }
      }

      // =====================================================
      // COLOR
      // =====================================================

      getColor() {
        const energy =
          Math.max(
            0,
            Math.min(
              1,
              this.colorEnergy
            )
          );

        if (
          energy <
          0.005
        ) {
          return "#080808";
        }

        const lightness =
          4 +
          energy *
            51;

        return `hsl(${this.colorHue}, 95%, ${lightness}%)`;
      }

      // =====================================================
      // DRAW
      // =====================================================

      draw() {
        ctx.save();

        ctx.translate(
          this.x,
          this.y
        );

        /*
         * Apply the proximity-driven spring scale.
         */
        ctx.scale(
          this.scale,
          this.scale
        );

        ctx.rotate(
          this.rotation
        );

        ctx.fillStyle =
          this.getColor();

        // ---------------------------------------------------
        // SQUARE
        // ---------------------------------------------------

        if (
          this.type ===
          "square"
        ) {
          ctx.fillRect(
            -this.size,
            -this.size,
            this.size * 2,
            this.size * 2
          );
        }

        // ---------------------------------------------------
        // RECTANGLE
        // ---------------------------------------------------

        else if (
          this.type ===
          "rectangle"
        ) {
          ctx.fillRect(
            -this.width *
              0.5,
            -this.height *
              0.5,
            this.width,
            this.height
          );
        }

        // ---------------------------------------------------
        // CIRCLE
        // ---------------------------------------------------

        else if (
          this.type ===
          "circle"
        ) {
          ctx.beginPath();

          ctx.arc(
            0,
            0,
            this.size,
            0,
            Math.PI * 2
          );

          ctx.fill();
        }

        // ---------------------------------------------------
        // TRIANGLE
        // ---------------------------------------------------

        else if (
          this.type ===
          "triangle"
        ) {
          ctx.beginPath();

          ctx.moveTo(
            0,
            -this.size *
              1.45
          );

          ctx.lineTo(
            this.size *
              1.35,
            this.size
          );

          ctx.lineTo(
            -this.size *
              1.35,
            this.size
          );

          ctx.closePath();

          ctx.fill();
        }

        // ---------------------------------------------------
        // DIAMOND
        // ---------------------------------------------------

        else if (
          this.type ===
          "diamond"
        ) {
          ctx.beginPath();

          ctx.moveTo(
            0,
            -this.size *
              1.5
          );

          ctx.lineTo(
            this.size *
              1.25,
            0
          );

          ctx.lineTo(
            0,
            this.size *
              1.5
          );

          ctx.lineTo(
            -this.size *
              1.25,
            0
          );

          ctx.closePath();

          ctx.fill();
        }

        // ---------------------------------------------------
        // CROSS
        // ---------------------------------------------------

        else if (
          this.type ===
          "cross"
        ) {
          const s =
            this.size;

          ctx.fillRect(
            -s * 0.32,
            -s * 1.5,
            s * 0.64,
            s * 3
          );

          ctx.fillRect(
            -s * 1.5,
            -s * 0.32,
            s * 3,
            s * 0.64
          );
        }

        ctx.restore();
      }
    }

    // =======================================================
    // PARTICLES
    // =======================================================

    const particleCount =
      Math.min(
        500,
        Math.max(
          180,
          Math.floor(
            (width * height) /
              3000
          )
        )
      );

    const particles = [];

    for (
      let i = 0;
      i < particleCount;
      i++
    ) {
      particles.push(
        new Particle(i)
      );
    }

    // =======================================================
    // SPATIAL HASH
    // =======================================================

    const buildGrid =
      () => {
        const cellSize =
          34;

        const grid =
          new Map();

        for (
          const particle of
          particles
        ) {
          const gx =
            Math.floor(
              particle.x /
                cellSize
            );

          const gy =
            Math.floor(
              particle.y /
                cellSize
            );

          const key =
            `${gx}:${gy}`;

          let cell =
            grid.get(key);

          if (!cell) {
            cell = [];

            grid.set(
              key,
              cell
            );
          }

          cell.push(
            particle
          );
        }

        return {
          grid,
          cellSize,
        };
      };

    // =======================================================
    // COLLISION SOLVER
    // =======================================================

    const solveCollisions =
      () => {
        /*
         * More passes = cleaner separation in dense areas.
         */
        const iterations = 4;

        for (
          let iteration = 0;
          iteration <
          iterations;
          iteration++
        ) {
          const {
            grid,
            cellSize,
          } =
            buildGrid();

          for (
            const a of
            particles
          ) {
            const gx =
              Math.floor(
                a.x /
                  cellSize
              );

            const gy =
              Math.floor(
                a.y /
                  cellSize
              );

            for (
              let ox = -1;
              ox <= 1;
              ox++
            ) {
              for (
                let oy = -1;
                oy <= 1;
                oy++
              ) {
                const cell =
                  grid.get(
                    `${gx + ox}:${gy + oy}`
                  );

                if (!cell) {
                  continue;
                }

                for (
                  const b of
                  cell
                ) {
                  if (
                    a.id >=
                    b.id
                  ) {
                    continue;
                  }

                  const dx =
                    b.x -
                    a.x;

                  const dy =
                    b.y -
                    a.y;

                  const distanceSq =
                    dx * dx +
                    dy * dy;

                  const minimum =
                    a.collisionRadius *
                      a.collisionScale +
                    b.collisionRadius *
                      b.collisionScale;

                  if (
                    distanceSq >=
                    minimum *
                      minimum
                  ) {
                    continue;
                  }

                  const distance =
                    Math.sqrt(
                      distanceSq
                    ) || 0.001;

                  const nx =
                    dx /
                    distance;

                  const ny =
                    dy /
                    distance;

                  const overlap =
                    minimum -
                    distance;

                  // =========================================
                  // POSITION CORRECTION
                  // =========================================

                  const totalMass =
                    a.mass +
                    b.mass;

                  const aWeight =
                    b.mass /
                    totalMass;

                  const bWeight =
                    a.mass /
                    totalMass;

                  const correction =
                    overlap *
                    0.58;

                  a.x -=
                    nx *
                    correction *
                    aWeight;

                  a.y -=
                    ny *
                    correction *
                    aWeight;

                  b.x +=
                    nx *
                    correction *
                    bWeight;

                  b.y +=
                    ny *
                    correction *
                    bWeight;

                  // =========================================
                  // RELATIVE VELOCITY
                  // =========================================

                  const rvx =
                    b.vx -
                    a.vx;

                  const rvy =
                    b.vy -
                    a.vy;

                  const relativeNormal =
                    rvx *
                      nx +
                    rvy *
                      ny;

                  // =========================================
                  // ELASTIC COLLISION
                  // =========================================

                  if (
                    relativeNormal <
                    0
                  ) {
                    const restitution =
                      Math.min(
                        a.restitution,
                        b.restitution,
                        OBJECT_RESTITUTION
                      );

                    const impulseMagnitude =
                      -(
                        1 +
                        restitution
                      ) *
                      relativeNormal;

                    const inverseMass =
                      1 /
                        a.mass +
                      1 /
                        b.mass;

                    const impulse =
                      impulseMagnitude /
                      inverseMass;

                    const impulseX =
                      impulse *
                      nx;

                    const impulseY =
                      impulse *
                      ny;

                    a.vx -=
                      impulseX /
                      a.mass;

                    a.vy -=
                      impulseY /
                      a.mass;

                    b.vx +=
                      impulseX /
                      b.mass;

                    b.vy +=
                      impulseY /
                      b.mass;
                  }

                  // =========================================
                  // VERY LOW SLIDING FRICTION
                  // =========================================

                  const tangentX =
                    -ny;

                  const tangentY =
                    nx;

                  const tangentVelocity =
                    rvx *
                      tangentX +
                    rvy *
                      tangentY;

                  const frictionImpulse =
                    -tangentVelocity *
                    COLLISION_FRICTION;

                  a.vx -=
                    tangentX *
                    frictionImpulse /
                    a.mass;

                  a.vy -=
                    tangentY *
                    frictionImpulse /
                    a.mass;

                  b.vx +=
                    tangentX *
                    frictionImpulse /
                    b.mass;

                  b.vy +=
                    tangentY *
                    frictionImpulse /
                    b.mass;

                  // =========================================
                  // SOFT FLUID PRESSURE
                  // =========================================

                  const pressureRange =
                    minimum *
                    1.7;

                  if (
                    distance <
                    pressureRange
                  ) {
                    const pressure =
                      (1 -
                        distance /
                          pressureRange) *
                      FLUID_PRESSURE;

                    /*
                     * Gentle separation before hard contact.
                     */
                    a.vx -=
                      nx *
                      pressure *
                      bWeight;

                    a.vy -=
                      ny *
                      pressure *
                      bWeight;

                    b.vx +=
                      nx *
                      pressure *
                      aWeight;

                    b.vy +=
                      ny *
                      pressure *
                      aWeight;
                  }
                }
              }
            }
          }
        }
      };

    // =======================================================
    // MOUSE VISUAL
    // =======================================================

    const drawMouseWave =
      () => {
        /*
         * Wave exists only while pointer is physically moving.
         */
        if (
          mouse.force <
          0.015
        ) {
          return;
        }

        const radius =
          24 +
          mouse.force *
            105;

        ctx.save();

        ctx.globalAlpha =
          mouse.force *
          0.09;

        ctx.beginPath();

        ctx.arc(
          mouse.x,
          mouse.y,
          radius,
          0,
          Math.PI * 2
        );

        ctx.strokeStyle =
          "#111";

        ctx.lineWidth = 1;

        ctx.stroke();

        ctx.globalAlpha =
          mouse.force *
          0.04;

        ctx.beginPath();

        ctx.arc(
          mouse.x,
          mouse.y,
          radius *
            0.55,
          0,
          Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
      };

    // =======================================================
    // MAIN LOOP
    // =======================================================

    const animate =
      (time) => {
        ctx.clearRect(
          0,
          0,
          width,
          height
        );

        // ---------------------------------------------------
        // UPDATE
        // ---------------------------------------------------

        for (
          const particle of
          particles
        ) {
          particle.update(
            time
          );
        }

        // ---------------------------------------------------
        // COLLISIONS
        // ---------------------------------------------------

        solveCollisions();

        // ---------------------------------------------------
        // MOUSE VISUAL
        // ---------------------------------------------------

        drawMouseWave();

        // ---------------------------------------------------
        // DRAW
        // ---------------------------------------------------

        for (
          const particle of
          particles
        ) {
          particle.draw();
        }

        // ===================================================
        // MOUSE FORCE STOP
        // ===================================================

        /*
         * VERY fast decay.
         *
         * This makes:
         *
         * move -> wave
         * stop -> immediately no new force
         *
         * Existing object momentum remains.
         */
        mouse.force *=
          0.035;

        mouse.velocityX *=
          0.08;

        mouse.velocityY *=
          0.08;

        mouse.speed *=
          0.08;

        if (
          mouse.force <
          0.001
        ) {
          mouse.force = 0;
        }

        if (
          Math.abs(
            mouse.velocityX
          ) < 0.015
        ) {
          mouse.velocityX = 0;
        }

        if (
          Math.abs(
            mouse.velocityY
          ) < 0.015
        ) {
          mouse.velocityY = 0;
        }

        animationFrame =
          requestAnimationFrame(
            animate
          );
      };

    animate(0);

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      resizeObserver.disconnect();

      section.removeEventListener(
        "mousemove",
        updateMouse
      );

      section.removeEventListener(
        "mouseleave",
        leaveMouse
      );
    };
  }, [startSimulation]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <section
      ref={sectionRef}
      className="contact"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      {/* =====================================================
          FLUID OBJECT CANVAS
      ===================================================== */}

      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,

          width: "100%",
          height: "100%",

          zIndex: 1,

          pointerEvents:
            "none",

          opacity:
            startSimulation
              ? 1
              : 0,

          transition:
            "opacity 700ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />

      {/* =====================================================
          CONTACT TEXT
      ===================================================== */}

      <div
        className="contact-inner"
        style={{
          position: "relative",
          zIndex: 2,

          width: "100%",
          height: "100%",

          display: "flex",
          flexDirection: "column",

          justifyContent:
            "center",

          alignItems:
            "center",

          pointerEvents:
            "none",
        }}
      >
        {startAnimation ? (
          <>
            <a
              href="https://github.com/sudipdas2011"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              <span className="contact-text">
                <span className="click-here">click here.</span>

                <TextRise
                  text="wanna contact ?"
                  className="hero-heading"
                />
              </span>
            </a>
          </>
        ) : (
          <h1
            style={{
              opacity: 0,
            }}
          >
            
          </h1>
        )}
      </div>
    </section>
  );
}
