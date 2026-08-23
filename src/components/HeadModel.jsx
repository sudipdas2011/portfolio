import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import headModelPath from "../assets/headModel.glb";

function Model() {
  const { scene } = useGLTF(headModelPath); 
  const modelRef = useRef();
  const { mouse } = useThree();

  // Establish internal physics parameters to track the dynamic entry progress metrics
  const entryState = useRef({
    currentY: -3,    // Starts way down below the monitor viewport bounds
    targetY: 0,   // Your final vertical target center baseline
    currentAngleOffset: -Math.PI, // Starts rotated completely sideways
    targetAngleOffset: -Math.PI / 2, // The final tracking angle origin base
    progress: 0      // Easing speed interpolation coefficient
  });

  const wireframeMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: "#ffffff",      
      wireframe: true,       
      transparent: true,     
      opacity: 0.5,          
    });
  }, []);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = wireframeMaterial;
      }
    });
  }, [scene, wireframeMaterial]);

  useFrame(() => {
    if (!modelRef.current) return;
    
    // Smoothly ease the entry tracking variables forward on every frame tick (lerp physics)
    entryState.current.currentY += (entryState.current.targetY - entryState.current.currentY) * 0.05;
    entryState.current.currentAngleOffset += (entryState.current.targetAngleOffset - entryState.current.currentAngleOffset) * 0.05;

    // Apply the real-time calculated rise-up position vectors
    modelRef.current.position.y = entryState.current.currentY;

    // Continuous mouse tracking rotation equations integrated with the entrance swivel tracking offset
    const mouseXRotation = -mouse.y * 0.4; 
    const mouseYRotation = (mouse.x * 0.4) + entryState.current.currentAngleOffset; 
    
    modelRef.current.rotation.x += (mouseXRotation - modelRef.current.rotation.x) * 0.08;
    modelRef.current.rotation.y += (mouseYRotation - modelRef.current.rotation.y) * 0.08;
  });

  return (
    <primitive 
      ref={modelRef} 
      object={scene} 
      position={[0, -4, 0]} // Initialized lower down to feed the physics loop calculation
      scale={2.2} 
      rotation={[0, -Math.PI, 0]} 
    />
  );
}

export default function HeadModel() {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas 
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }} 
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Suspense fallback={null}>
          <Model />
        </Suspense>

        <EffectComposer>
          <Bloom intensity={0.1} luminanceThreshold={0.1} luminanceSmoothing={0.9} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

useGLTF.preload(headModelPath);
