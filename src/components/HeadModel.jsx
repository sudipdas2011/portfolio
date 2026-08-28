import React, {
  useRef,
  Suspense,
  useMemo,
} from "react";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  useGLTF,
  Text,
} from "@react-three/drei";

import {
  EffectComposer,
  Bloom,
} from "@react-three/postprocessing";

import * as THREE from "three";

import headModelPath from "../assets/headModel.glb";


// ============================================================
// 3D MODEL
// ============================================================

function Model({ modelRef }) {
  const { scene } = useGLTF(headModelPath);
  const { mouse } = useThree();

  const prevMouse = useRef(
    new THREE.Vector2(0, 0)
  );

  const currentVelocity = useRef(0);

  const entryState = useRef({
    currentY: -3,
    targetY: 0,

    currentAngleOffset: -Math.PI,
    targetAngleOffset: -Math.PI / 2,

    progress: 0,
  });


  // ----------------------------------------------------------
  // ORIGINAL SHADER
  // ----------------------------------------------------------

  const glowingWireframeShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      wireframe: true,
      transparent: true,
      depthWrite: true,

      uniforms: {
        uTime: {
          value: 0,
        },

        uMouse: {
          value: new THREE.Vector2(0, 0),
        },

        uVelocity: {
          value: 0,
        },

        uColorFar: {
          value: new THREE.Color(
            "#020916"
          ),
        },

        uColorMidFar: {
          value: new THREE.Color(
            "#0033aa"
          ),
        },

        uColorMidNear: {
          value: new THREE.Color(
            "#00ffbb"
          ),
        },

        uColorNear: {
          value: new THREE.Color(
            "#ccff00"
          ),
        },

        uShadowDarkness: {
          value: 0.05,
        },

        uShadowSpread: {
          value: 0.4,
        },
      },


      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        uniform float uVelocity;

        varying vec3 vLocalPosition;
        varying vec3 vLocalNormal;
        varying vec4 vViewPosition;

        void main() {

          vLocalNormal =
            normalize(normal);

          vLocalPosition =
            position;

          vec4 mvPosition =
            modelViewMatrix *
            vec4(position, 1.0);

          vec4 clipPosition =
            projectionMatrix *
            mvPosition;

          vec2 ndc =
            clipPosition.xy /
            clipPosition.w;

          float mouseDist =
            distance(
              ndc,
              uMouse
            );

          float rippleForce =
            smoothstep(
              0.5,
              0.0,
              mouseDist
            );

          float wave =
            sin(
              mouseDist * 25.0 -
              uTime * 8.0
            )
            *
            rippleForce
            *
            0.015
            *
            uVelocity;

          vec3 displacedPosition =
            position +
            normal * wave;

          vec4 displacedMvPosition =
            modelViewMatrix *
            vec4(
              displacedPosition,
              1.0
            );

          vViewPosition =
            displacedMvPosition;

          gl_Position =
            projectionMatrix *
            displacedMvPosition;
        }
      `,


      fragmentShader: `
        uniform float uTime;

        uniform vec3 uColorFar;
        uniform vec3 uColorMidFar;
        uniform vec3 uColorMidNear;
        uniform vec3 uColorNear;

        uniform float uShadowDarkness;
        uniform float uShadowSpread;

        varying vec3 vLocalPosition;
        varying vec3 vLocalNormal;
        varying vec4 vViewPosition;


        float hash(vec3 p) {

          p = fract(
            p *
            vec3(
              443.8975,
              397.2973,
              491.1871
            )
          );

          p += dot(
            p.xyz,
            p.yzx + 19.19
          );

          return fract(
            p.x *
            p.y *
            p.z
          );
        }


        float noise(vec3 p) {

          vec3 i =
            floor(p);

          vec3 f =
            fract(p);

          f =
            f *
            f *
            (3.0 - 2.0 * f);

          return mix(

            mix(

              mix(
                hash(
                  i +
                  vec3(0,0,0)
                ),

                hash(
                  i +
                  vec3(1,0,0)
                ),

                f.x
              ),

              mix(
                hash(
                  i +
                  vec3(0,1,0)
                ),

                hash(
                  i +
                  vec3(1,1,0)
                ),

                f.x
              ),

              f.y
            ),

            mix(

              mix(
                hash(
                  i +
                  vec3(0,0,1)
                ),

                hash(
                  i +
                  vec3(1,0,1)
                ),

                f.x
              ),

              mix(
                hash(
                  i +
                  vec3(0,1,1)
                ),

                hash(
                  i +
                  vec3(1,1,1)
                ),

                f.x
              ),

              f.y
            ),

            f.z
          );
        }


        void main() {

          float viewDepth =
            -vViewPosition.z;

          float normalizedDepth =
            (viewDepth - 3.2) /
            1.5;

          float depthMap =
            1.0 -
            clamp(
              normalizedDepth,
              0.0,
              1.0
            );


          vec3 noiseCoord =
            vLocalPosition *
            4.0
            +
            vec3(
              0.0,
              uTime * 1.0,
              uTime * 0.4
            );


          float liquidNoise =
            noise(noiseCoord) *
            0.12;


          float finalDepth =
            clamp(
              depthMap +
              liquidNoise,
              0.0,
              1.0
            );


          vec3 baseGradient;


          if (
            finalDepth < 0.33
          ) {

            baseGradient =
              mix(
                uColorFar,
                uColorMidFar,

                smoothstep(
                  0.0,
                  0.33,
                  finalDepth
                )
              );

          }

          else if (
            finalDepth < 0.66
          ) {

            baseGradient =
              mix(
                uColorMidFar,
                uColorMidNear,

                smoothstep(
                  0.33,
                  0.66,
                  finalDepth
                )
              );

          }

          else {

            baseGradient =
              mix(
                uColorMidNear,
                uColorNear,

                smoothstep(
                  0.66,
                  1.0,
                  finalDepth
                )
              );
          }


          vec3 localCenterOffset =
            normalize(
              vLocalPosition
            );


          float cavityFactor =
            dot(
              vLocalNormal,
              localCenterOffset
            );


          float shadowMask =
            smoothstep(
              -0.2,
              uShadowSpread,
              cavityFactor
            );


          float jointShadow =
            mix(
              uShadowDarkness,
              1.0,
              shadowMask
            );


          gl_FragColor =
            vec4(
              baseGradient *
              jointShadow,
              1.0
            );
        }
      `,

      side: THREE.DoubleSide,
    });
  }, []);


  useMemo(() => {

    scene.traverse(
      (child) => {

        if (child.isMesh) {

          child.material =
            glowingWireframeShader;
        }
      }
    );

  }, [
    scene,
    glowingWireframeShader,
  ]);


  // ----------------------------------------------------------
  // MODEL ANIMATION
  // ----------------------------------------------------------

  useFrame((state) => {

    if (!modelRef.current)
      return;


    glowingWireframeShader
      .uniforms
      .uTime
      .value =
      state.clock.getElapsedTime();


    glowingWireframeShader
      .uniforms
      .uMouse
      .value
      .set(
        mouse.x,
        mouse.y
      );


    const distanceMoved =
      mouse.distanceTo(
        prevMouse.current
      );


    const targetVelocity =
      Math.min(
        distanceMoved * 25.0,
        1.0
      );


    currentVelocity.current +=
      (
        targetVelocity -
        currentVelocity.current
      ) * 0.1;


    glowingWireframeShader
      .uniforms
      .uVelocity
      .value =
      currentVelocity.current;


    prevMouse.current.copy(mouse);


    entryState.current.currentY +=
      (
        entryState.current.targetY -
        entryState.current.currentY
      ) * 0.05;


    entryState.current.currentAngleOffset +=
      (
        entryState.current.targetAngleOffset -
        entryState.current.currentAngleOffset
      ) * 0.05;


    modelRef.current.position.y =
      entryState.current.currentY;


    const mouseXRotation =
      -mouse.y * 0.4;


    const mouseYRotation =
      mouse.x * 0.4 +
      entryState.current.currentAngleOffset;


    modelRef.current.rotation.x +=
      (
        mouseXRotation -
        modelRef.current.rotation.x
      ) * 0.08;


    modelRef.current.rotation.y +=
      (
        mouseYRotation -
        modelRef.current.rotation.y
      ) * 0.08;

  });


  return (
    <group
      ref={modelRef}

      position={[
        0,
        -4,
        0,
      ]}

      scale={2.2}

      rotation={[
        0,
        -Math.PI,
        0,
      ]}
    >

      <primitive
        object={scene}
      />

    </group>
  );
}


// ============================================================
// INDIVIDUAL TYPOGRAPHY
// ============================================================

function TextLayer({ modelRef }) {

  const { camera, size } =
    useThree();


  // ----------------------------------------------------------
  // WORD LISTS
  //
  // Every word is now an independent Text object.
  // ----------------------------------------------------------

  const leftWords = useMemo(
    () => [

      {
        text: "Polymath",
        size: 0.42,
        rotation: -0.015,
        opacity: 0.96,
        offsetX: 0.00,
        offsetY: 0.00,
      },

      {
        text: "Aesthete",
        size: 0.34,
        rotation: 0.035,
        opacity: 0.55,
        offsetX: 0.10,
        offsetY: -0.03,
      },

      {
        text: "Visionary",
        size: 0.46,
        rotation: -0.025,
        opacity: 0.88,
        offsetX: -0.04,
        offsetY: 0.01,
      },

      {
        text: "Artisan",
        size: 0.31,
        rotation: 0.055,
        opacity: 0.46,
        offsetX: 0.12,
        offsetY: -0.02,
      },

      {
        text: "Expressive",
        size: 0.37,
        rotation: -0.035,
        opacity: 0.78,
        offsetX: -0.02,
        offsetY: 0.03,
      },

      {
        text: "Innovative",
        size: 0.43,
        rotation: 0.02,
        opacity: 0.93,
        offsetX: 0.06,
        offsetY: -0.02,
      },

    ],
    []
  );


  const rightWords = useMemo(
    () => [

      {
        text: "Ideator",
        size: 0.39,
        rotation: 0.025,
        opacity: 0.92,
        offsetX: 0.00,
        offsetY: 0.00,
      },

      {
        text: "Strategist",
        size: 0.34,
        rotation: -0.04,
        opacity: 0.58,
        offsetX: -0.08,
        offsetY: 0.02,
      },

      {
        text: "Catalyst",
        size: 0.44,
        rotation: 0.025,
        opacity: 0.91,
        offsetX: 0.03,
        offsetY: -0.015,
      },

      {
        text: "Analyst",
        size: 0.30,
        rotation: -0.055,
        opacity: 0.48,
        offsetX: -0.04,
        offsetY: 0.025,
      },

      {
        text: "Futurist",
        size: 0.43,
        rotation: 0.035,
        opacity: 0.87,
        offsetX: 0.06,
        offsetY: -0.025,
      },

    ],
    []
  );


  // ----------------------------------------------------------
  // REFS FOR EVERY WORD
  // ----------------------------------------------------------

  const leftRefs =
    useRef([]);

  const rightRefs =
    useRef([]);


  // ----------------------------------------------------------
  // BOUNDING BOX
  // ----------------------------------------------------------

  const box = useMemo(
    () => new THREE.Box3(),
    []
  );


  const corners = useMemo(
    () =>
      Array.from(
        { length: 8 },
        () =>
          new THREE.Vector3()
      ),
    []
  );


  const projected = useMemo(
    () =>
      Array.from(
        { length: 8 },
        () =>
          new THREE.Vector3()
      ),
    []
  );


  // ----------------------------------------------------------
  // WORLD POSITION FROM SCREEN POSITION
  // ----------------------------------------------------------

  const getWorldPoint =
    (
      ndcX,
      ndcY,
      z
    ) => {

      const origin =
        new THREE.Vector3();

      origin.setFromMatrixPosition(
        camera.matrixWorld
      );


      const direction =
        new THREE.Vector3(
          ndcX,
          ndcY,
          0.5
        )
          .unproject(camera)
          .sub(origin)
          .normalize();


      const distance =
        (
          z -
          origin.z
        ) /
        (
          direction.z ||
          -0.000001
        );


      return origin.clone().add(
        direction.multiplyScalar(
          distance
        )
      );
    };


  // ----------------------------------------------------------
  // TYPOGRAPHY LAYOUT
  // ----------------------------------------------------------

  useFrame(() => {

    if (!modelRef.current)
      return;


    modelRef.current.updateWorldMatrix(
      true,
      true
    );


    box.setFromObject(
      modelRef.current,
      true
    );


    if (box.isEmpty())
      return;


    const min = box.min;
    const max = box.max;


    // --------------------------------------------------------
    // 8 CORNERS OF 3D BOUNDING BOX
    // --------------------------------------------------------

    corners[0].set(
      min.x,
      min.y,
      min.z
    );

    corners[1].set(
      max.x,
      min.y,
      min.z
    );

    corners[2].set(
      min.x,
      max.y,
      min.z
    );

    corners[3].set(
      max.x,
      max.y,
      min.z
    );

    corners[4].set(
      min.x,
      min.y,
      max.z
    );

    corners[5].set(
      max.x,
      min.y,
      max.z
    );

    corners[6].set(
      min.x,
      max.y,
      max.z
    );

    corners[7].set(
      max.x,
      max.y,
      max.z
    );


    // --------------------------------------------------------
    // PROJECT MODEL TO SCREEN
    // --------------------------------------------------------

    let minX = Infinity;
    let maxX = -Infinity;

    let minY = Infinity;
    let maxY = -Infinity;


    for (
      let i = 0;
      i < corners.length;
      i++
    ) {

      projected[i]
        .copy(corners[i])
        .project(camera);


      minX =
        Math.min(
          minX,
          projected[i].x
        );


      maxX =
        Math.max(
          maxX,
          projected[i].x
        );


      minY =
        Math.min(
          minY,
          projected[i].y
        );


      maxY =
        Math.max(
          maxY,
          projected[i].y
        );
    }


    // --------------------------------------------------------
    // TEXT PLANE
    // --------------------------------------------------------

    const textZ = -1.05;


    const modelLeft =
      getWorldPoint(
        minX,
        0,
        textZ
      ).x;


    const modelRight =
      getWorldPoint(
        maxX,
        0,
        textZ
      ).x;


    const modelTop =
      getWorldPoint(
        0,
        maxY,
        textZ
      ).y;


    const modelBottom =
      getWorldPoint(
        0,
        minY,
        textZ
      ).y;


    const modelWidth =
      Math.max(
        0.1,
        modelRight -
        modelLeft
      );


    const modelHeight =
      Math.max(
        0.1,
        modelTop -
        modelBottom
      );


    // --------------------------------------------------------
    // RESPONSIVE SCALE
    // --------------------------------------------------------

    const responsive =
      THREE.MathUtils.clamp(
        size.width / 1500,
        0.70,
        1.0
      );


    // --------------------------------------------------------
    // TEXT GROUP VERTICAL RANGE
    //
    // Each word gets its own position along this range.
    // --------------------------------------------------------

    const verticalPadding =
      modelHeight * 0.05;


    const usableTop =
      modelTop -
      verticalPadding;


    const usableBottom =
      modelBottom +
      verticalPadding;


    const leftStep =
      (
        usableTop -
        usableBottom
      ) /
      Math.max(
        leftWords.length - 1,
        1
      );


    const rightStep =
      (
        usableTop -
        usableBottom
      ) /
      Math.max(
        rightWords.length - 1,
        1
      );


    // --------------------------------------------------------
    // LEFT WORDS
    // --------------------------------------------------------

    leftWords.forEach(
      (word, index) => {

        const ref =
          leftRefs.current[index];


        if (!ref)
          return;


        const baseY =
          usableTop -
          index * leftStep;


        // Each word gets a different horizontal
        // relationship to the model.
        const dynamicOffset =
          modelWidth *
          word.offsetX;


        const x =
          modelLeft -
          modelWidth * 0.055 +
          dynamicOffset;


        ref.position.set(
          x,
          baseY +
            modelHeight *
            word.offsetY,
          textZ
        );


        // Individual typography scale.
        ref.fontSize =
          word.size *
          responsive;


        // Individual rotation.
        ref.rotation.z =
          word.rotation;


        // Independent opacity.
        ref.fillOpacity =
          word.opacity;


        // Individual word width.
        ref.maxWidth =
          THREE.MathUtils.clamp(
            modelWidth * 0.46,
            0.65,
            1.7
          );
      }
    );


    // --------------------------------------------------------
    // RIGHT WORDS
    // --------------------------------------------------------

    rightWords.forEach(
      (word, index) => {

        const ref =
          rightRefs.current[index];


        if (!ref)
          return;


        const baseY =
          usableTop -
          index * rightStep;


        const dynamicOffset =
          modelWidth *
          word.offsetX;


        const x =
          modelRight +
          modelWidth * 0.055 +
          dynamicOffset;


        ref.position.set(
          x,
          baseY +
            modelHeight *
            word.offsetY,
          textZ
        );


        ref.fontSize =
          word.size *
          responsive;


        ref.rotation.z =
          word.rotation;


        ref.fillOpacity =
          word.opacity;


        ref.maxWidth =
          THREE.MathUtils.clamp(
            modelWidth * 0.46,
            0.65,
            1.7
          );
      }
    );


    // --------------------------------------------------------
    // VIEWPORT LIMITS
    // --------------------------------------------------------

    const halfViewWidth =
      visibleWorldWidthAtZ(
        camera,
        size,
        textZ
      ) * 0.5;


    // --------------------------------------------------------
    // KEEP LEFT TYPOGRAPHY INSIDE VIEW
    // --------------------------------------------------------

    leftRefs.current.forEach(
      (ref) => {

        if (!ref)
          return;


        if (
          ref.position.x <
          -halfViewWidth
        ) {

          ref.position.x =
            -halfViewWidth +
            0.15;
        }
      }
    );


    // --------------------------------------------------------
    // KEEP RIGHT TYPOGRAPHY INSIDE VIEW
    // --------------------------------------------------------

    rightRefs.current.forEach(
      (ref) => {

        if (!ref)
          return;


        if (
          ref.position.x >
          halfViewWidth
        ) {

          ref.position.x =
            halfViewWidth -
            0.15;
        }
      }
    );
  });


  // ==========================================================
  // RENDER EVERY WORD INDEPENDENTLY
  // ==========================================================

  return (
    <>

      {/* ======================================================
          LEFT TYPOGRAPHY
          ====================================================== */}

      {leftWords.map(
        (word, index) => (

          <Text
            key={`left-${word.text}`}

            ref={(el) => {
              leftRefs.current[index] =
                el;
            }}

            position={[
              -1.5,
              0,
              -1.05,
            ]}

            fontSize={
              word.size
            }

            maxWidth={1.4}

            lineHeight={1}

            letterSpacing={
              -0.025
            }

            anchorX="right"
            anchorY="middle"

            color="#ffffff"

            fillOpacity={
              word.opacity
            }

            depthTest={false}
            depthWrite={false}

            renderOrder={1}
          >
            {word.text}
          </Text>

        )
      )}


      {/* ======================================================
          RIGHT TYPOGRAPHY
          ====================================================== */}

      {rightWords.map(
        (word, index) => (

          <Text
            key={`right-${word.text}`}

            ref={(el) => {
              rightRefs.current[index] =
                el;
            }}

            position={[
              1.5,
              0,
              -1.05,
            ]}

            fontSize={
              word.size
            }

            maxWidth={1.4}

            lineHeight={1}

            letterSpacing={
              -0.025
            }

            anchorX="left"
            anchorY="middle"

            color="#ffffff"

            fillOpacity={
              word.opacity
            }

            depthTest={false}
            depthWrite={false}

            renderOrder={1}
          >
            {word.text}
          </Text>

        )
      )}

    </>
  );
}


// ============================================================
// VIEWPORT WIDTH
// ============================================================

function visibleWorldWidthAtZ(
  camera,
  size,
  z
) {

  if (
    camera.isOrthographicCamera
  ) {

    return (
      camera.right -
      camera.left
    );
  }


  const distance =
    Math.abs(
      camera.position.z -
      z
    );


  const vertical =
    2 *
    Math.tan(
      THREE.MathUtils.degToRad(
        camera.fov * 0.5
      )
    ) *
    distance;


  return (
    vertical *
    (
      size.width /
      size.height
    )
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HeadModel() {

  const modelRef =
    useRef();


  return (

    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >

      <Canvas

        camera={{
          position: [
            0,
            0,
            4.5,
          ],

          fov: 45,
        }}

        gl={{
          alpha: true,
          antialias: true,
        }}

        onCreated={({ gl }) => {

          gl.setClearColor(
            0x000000,
            0
          );

        }}
      >

        <Suspense
          fallback={null}
        >

          {/* --------------------------------------------------
              INDIVIDUAL WORD TYPOGRAPHY
              -------------------------------------------------- */}

          <TextLayer
            modelRef={modelRef}
          />


          {/* --------------------------------------------------
              3D MODEL
              -------------------------------------------------- */}

          <Model
            modelRef={modelRef}
          />

        </Suspense>


        <EffectComposer>

          <Bloom
            intensity={0}
            luminanceThreshold={0.05}
            luminanceSmoothing={0.7}
          />

        </EffectComposer>

      </Canvas>

    </div>
  );
}


// ============================================================
// PRELOAD MODEL
// ============================================================

useGLTF.preload(
  headModelPath
);