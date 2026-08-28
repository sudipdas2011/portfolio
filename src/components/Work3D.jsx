import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  MeshTransmissionMaterial,
} from "@react-three/drei";
import * as THREE from "three";

function WorkObject({ activeIndex = 0 }) {
  const groupRef = useRef(null);
  const materialRef = useRef(null);

  const geometry = useMemo(() => {
    switch (activeIndex) {
      case 1:
        return new THREE.BoxGeometry(
          1.65,
          1.65,
          1.65,
          3,
          3,
          3
        );

      case 2:
        return new THREE.TorusGeometry(
          1.05,
          0.34,
          24,
          72
        );

      default:
        return new THREE.IcosahedronGeometry(
          1.28,
          2
        );
    }
  }, [activeIndex]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    /*
     * Different forms have slightly different poses.
     */
    const targetRotation = {
      x:
        activeIndex === 0
          ? 0.18
          : activeIndex === 1
            ? -0.25
            : 0.3,

      y:
        activeIndex === 0
          ? 0.5
          : activeIndex === 1
            ? -0.35
            : 0.7,

      z:
        activeIndex === 2
          ? 0.25
          : 0,
    };

    groupRef.current.rotation.x =
      THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetRotation.x,
        3.2,
        delta
      );

    groupRef.current.rotation.y =
      THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetRotation.y,
        3.2,
        delta
      );

    groupRef.current.rotation.z =
      THREE.MathUtils.damp(
        groupRef.current.rotation.z,
        targetRotation.z,
        3.2,
        delta
      );

    /*
     * Constant subtle rotation.
     */
    groupRef.current.rotation.y +=
      delta *
      (activeIndex === 2 ? 0.45 : 0.22);

    /*
     * Slight size variation between pages.
     */
    const targetScale =
      activeIndex === 0
        ? 1
        : activeIndex === 1
          ? 0.92
          : 1.05;

    const currentScale =
      groupRef.current.scale.x;

    const nextScale =
      THREE.MathUtils.damp(
        currentScale,
        targetScale,
        3.5,
        delta
      );

    groupRef.current.scale.setScalar(
      nextScale
    );

    /*
     * Smoothly change refraction thickness.
     */
    if (materialRef.current) {
      materialRef.current.thickness =
        THREE.MathUtils.damp(
          materialRef.current.thickness,
          activeIndex === 2
            ? 0.9
            : 0.65,
          3,
          delta
        );
    }
  });

  return (
    <group ref={groupRef}>
      <Float
        speed={1.15}
        rotationIntensity={0.12}
        floatIntensity={0.25}
      >
        {/* =====================================================
            MAIN REFRACTIVE OBJECT
        ===================================================== */}

        <mesh geometry={geometry}>
          <MeshTransmissionMaterial
            ref={materialRef}
            backside
            samples={4}
            resolution={512}
            thickness={0.65}
            roughness={0.08}
            ior={1.45}
            chromaticAberration={0.035}
            anisotropy={0.15}
            distortion={0.08}
            distortionScale={0.25}
            temporalDistortion={0.03}
            color="#ffffff"
          />
        </mesh>

        {/* =====================================================
            VERY SUBTLE STRUCTURAL EDGE
        ===================================================== */}

        <mesh
          geometry={geometry}
          scale={1.012}
        >
          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.16}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Scene({ activeIndex }) {
  return (
    <>
      {/* BASE LIGHT */}

      <ambientLight intensity={0.35} />

      {/* KEY LIGHT */}

      <directionalLight
        position={[3, 4, 5]}
        intensity={3}
      />

      {/* FRONT / SIDE LIGHT */}

      <pointLight
        position={[-3, -2, 4]}
        intensity={2}
      />

      {/* RIM LIGHT */}

      <pointLight
        position={[3, 1, -3]}
        intensity={1.5}
      />

      <WorkObject
        activeIndex={activeIndex}
      />

      {/* Environment is important for the glass/refraction. */}

      <Environment preset="studio" />
    </>
  );
}

export default function Work3D({
  activeIndex = 0,
}) {
  return (
    <div
      className="work-canvas"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      <Canvas
        dpr={[1, 1.75]}
        camera={{
          position: [0, 0, 4.5],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference:
            "high-performance",
        }}
      >
        <Scene
          activeIndex={activeIndex}
        />
      </Canvas>
    </div>
  );
}