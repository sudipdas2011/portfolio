import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";

function Scene({ activeIndex, mousePos }) {
  const meshRef = useRef();
  const lightRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;

    const targetScale = activeIndex === 0 ? 1.4 : activeIndex === 1 ? 0.9 : 1.2;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

    const baseSpeed = activeIndex === 1 ? 1.5 : 0.4;
    meshRef.current.rotation.y += baseSpeed * 0.01;
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, mousePos.current.y * 0.5, 0.1);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, mousePos.current.x * 0.3, 0.1);

    if (lightRef.current) {
      lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, mousePos.current.x * 5, 0.1);
      lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, mousePos.current.y * 5, 0.1);
    }
  });

  const getGeometry = () => {
    switch (activeIndex) {
      case 0: return new THREE.IcosahedronGeometry(1.2, 1);
      case 1: return new THREE.BoxGeometry(1.5, 1.5, 1.5);
      case 2: return new THREE.TorusGeometry(1, 0.4, 12, 24);
      default: return new THREE.IcosahedronGeometry(1, 1);
    }
  };

  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight ref={lightRef} position={[2, 4, 3]} intensity={2.5} />
      <Center>
        <mesh ref={meshRef}>
          <primitive object={getGeometry()} attach="geometry" />
          <meshStandardMaterial
            color="#ffffff"
            wireframe={activeIndex !== 1}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      </Center>
    </>
  );
}

export default function Work3D({ activeIndex, mousePos }) {
  return (
    <div className="work-canvas">
      <Canvas camera={{ position:[], fov: 45 }} gl={{ antialias: true }}>
        <Scene activeIndex={activeIndex} mousePos={mousePos} />
      </Canvas>
    </div>
  );
}
