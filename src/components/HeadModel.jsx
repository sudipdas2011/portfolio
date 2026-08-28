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

  const entryState = useRef({
    currentY: -3,    
    targetY: 0,   
    currentAngleOffset: -Math.PI, 
    targetAngleOffset: -Math.PI / 2, 
    progress: 0      
  });

  // Custom Shader Material that physically warps the 3D geometry vertices
  const glowingWireframeShader = useMemo(() => {
    return new THREE.ShaderMaterial({
      wireframe: true, 
      transparent: true,
      depthWrite: true,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) }, 
        uColorFar: { value: new THREE.Color("#020916") },       
        uColorMidFar: { value: new THREE.Color("#0033aa") },    
        uColorMidNear: { value: new THREE.Color("#00ffbb") },   
        uColorNear: { value: new THREE.Color("#ccff00") },      
        uShadowDarkness: { value: 0.05 }, 
        uShadowSpread: { value: 0.4 }      
      },
      vertexShader: `
        uniform float uTime;
        uniform vec2 uMouse;
        
        varying vec3 vLocalPosition;
        varying vec3 vLocalNormal;
        varying vec4 vViewPosition;
        
        void main() {
          vLocalNormal = normalize(normal); 
          vLocalPosition = position;
          
          // Calculate the default camera projected space first to find screen coordinates
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vec4 clipPosition = projectionMatrix * mvPosition;
          vec2 ndc = clipPosition.xy / clipPosition.w; // 2D flat screen position of this vertex
          
          // Measure distance from the flat screen cursor to this vertex point
          float mouseDist = distance(ndc, uMouse);
          
          // 1. PHYSICAL GEOMETRY RIPPLE CALCULATION
          // Radius of ripple displacement on screen (0.5 bounds)
          float rippleForce = smoothstep(0.5, 0.0, mouseDist);
          // Smooth geometric displacement height wave equation
          float wave = sin(mouseDist * 25.0 - uTime * 8.0) * rippleForce * 0.002; //RIPPLE INTENSITY
          
          // 2. DISPLACE VERTICES ALONG THEIR NORMALS
          // This physically deforms the mesh coordinates smoothly outward under your cursor
          vec3 displacedPosition = position + normal * wave;
          
          // 3. Recalculate real position matrices using the newly warped geometry bounds
          vec4 displacedMvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
          vViewPosition = displacedMvPosition;
          
          gl_Position = projectionMatrix * displacedMvPosition;
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
          p = fract(p * vec3(443.8975, 397.2973, 491.1871));
          p += dot(p.xyz, p.yzx + 19.19);
          return fract(p.x * p.y * p.z);
        }
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f*f*(3.0-2.0*f);
          return mix(
            mix(mix(hash(i+vec3(0,0,0)), hash(i+vec3(1,0,0)), f.x),
                mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x),
                mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z
          );
        }

        void main() {
          // Core Front-to-Back View Depth Map Calculation
          float viewDepth = -vViewPosition.z;
          float normalizedDepth = (viewDepth - 3.2) / 1.5; 
          float depthMap = 1.0 - clamp(normalizedDepth, 0.0, 1.0);

          // Liquid Noise Texture Overlay
          vec3 noiseCoord = vLocalPosition * 4.0 + vec3(0.0, uTime * 1.0, uTime * 0.4);
          float liquidNoise = noise(noiseCoord) * 0.12;
          float finalDepth = clamp(depthMap + liquidNoise, 0.0, 1.0);

          // Multi-tier Base Color Gradient Setup
          vec3 baseGradient;
          if (finalDepth < 0.33) {
            baseGradient = mix(uColorFar, uColorMidFar, smoothstep(0.0, 0.33, finalDepth));
          } else if (finalDepth < 0.66) {
            baseGradient = mix(uColorMidFar, uColorMidNear, smoothstep(0.33, 0.66, finalDepth));
          } else {
            baseGradient = mix(uColorMidNear, uColorNear, smoothstep(0.66, 1.0, finalDepth));
          }

          // Local Fixed Cavity Shadow Mask
          vec3 localCenterOffset = normalize(vLocalPosition);
          float cavityFactor = dot(vLocalNormal, localCenterOffset);
          float shadowMask = smoothstep(-0.2, uShadowSpread, cavityFactor);
          float jointShadow = mix(uShadowDarkness, 1.0, shadowMask);

          gl_FragColor = vec4(baseGradient * jointShadow, 1.0);
        }
      `,
      side: THREE.DoubleSide
    });
  }, []);

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = glowingWireframeShader;
      }
    });
  }, [scene, glowingWireframeShader]);

  useFrame((state) => {
    if (!modelRef.current) return;

    // Send clock ticks to both the vertex and fragment shader channels synchronously
    glowingWireframeShader.uniforms.uTime.value = state.clock.getElapsedTime();
    glowingWireframeShader.uniforms.uMouse.value.set(mouse.x, mouse.y);

    // Easing entry physics animations loops
    entryState.current.currentY += (entryState.current.targetY - entryState.current.currentY) * 0.05;
    entryState.current.currentAngleOffset += (entryState.current.targetAngleOffset - entryState.current.currentAngleOffset) * 0.05;

    modelRef.current.position.y = entryState.current.currentY;

    const mouseXRotation = -mouse.y * 0.4; 
    const mouseYRotation = (mouse.x * 0.4) + entryState.current.currentAngleOffset; 
    
    modelRef.current.rotation.x += (mouseXRotation - modelRef.current.rotation.x) * 0.08;
    modelRef.current.rotation.y += (mouseYRotation - modelRef.current.rotation.y) * 0.08;
  });

  return (
    <group ref={modelRef} position={[0, -4, 0]} scale={2.2} rotation={[0, -Math.PI, 0]}>
      <primitive object={scene} />
    </group>
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
          <Bloom intensity={0.6} luminanceThreshold={0.05} luminanceSmoothing={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

useGLTF.preload(headModelPath);
