import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";

function CubeScene({ mousePos }) {
  const meshRef = useRef();
  const lightRef = useRef();

  useFrame(() => {
    if (!meshRef.current) return;

    meshRef.current.rotation.y += 0.008;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, mousePos.current.y * 0.4, 0.1);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, mousePos.current.x * 0.2, 0.1);

    if (lightRef.current) {
      lightRef.current.position.x = THREE.MathUtils.lerp(lightRef.current.position.x, mousePos.current.x * 4, 0.1);
      lightRef.current.position.y = THREE.MathUtils.lerp(lightRef.current.position.y, mousePos.current.y * 4, 0.1);
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight ref={lightRef} position={[5, 5, 5]} intensity={2.5} />
      <Center>
        <mesh ref={meshRef}>
          <boxGeometry args={[1.5, 1.5, 1.5]} />
          <meshStandardMaterial
            color="#ffffff"
            wireframe={false}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>
      </Center>
    </>
  );
}

export default function Work3D({ mousePos }) {
  return (
    <div className="work-canvas" style={{ width: "100%", height: "100%" }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} gl={{ antialias: true }}>
        <CubeScene mousePos={mousePos} />
      </Canvas>
    </div>
  );
}
