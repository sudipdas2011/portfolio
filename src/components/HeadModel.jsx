import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing"; // 🌟 ADDED FOR GLOW EFFECT
import * as THREE from "three";

import headModelPath from "../assets/headModel.glb";

function Model() {
  const { scene } = useGLTF(headModelPath); 
  const modelRef = useRef();
  const { mouse } = useThree();

  // Create a pure white wireframe material
  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: "#ffffff",      // Pure white lines
      wireframe: true,       // Renders the underlying structural triangles
      transparent: true,     
      opacity: 0.5,          // Slightly muted so dense mesh details don't blend together
    });
  }, []);

  // Traverse the 3D asset meshes and assign our wireframe style
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = wireframeMaterial;
      }
    });
  }, [scene, wireframeMaterial]);

    useFrame(() => {
      if (!modelRef.current) return;
      
      // 🎯 FIXED: Added a minus sign (-) to correct the inverted up/down rotation
      const targetX = -mouse.y * 0.4; 
      const targetY = (mouse.x * 0.4) - (Math.PI / 2); 
      
      modelRef.current.rotation.x += (targetX - modelRef.current.rotation.x) * 0.08;
      modelRef.current.rotation.y += (targetY - modelRef.current.rotation.y) * 0.08;
    });


  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      position={[0, -1, 0]} 
      scale={2.2} 
      rotation={[0, -Math.PI / 2, 0]} 
    />
  );
}

export default function HeadModel() {
  return (
    <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0, zIndex: 1 }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ alpha: true, antialias: true }} 
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Suspense fallback={null}>
          <Model />
        </Suspense>

        {/* 🌟 EFFECT PIPELINE: Adds the post-processing layers */}
        <EffectComposer>
          <Bloom 
            intensity={0.1}          // How strong the glow emission is
            luminanceThreshold={0.1} // The color brightness level that triggers the bloom
            luminanceSmoothing={0.9} // Smooth falloff blend borders for the glow aura
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

useGLTF.preload(headModelPath);
