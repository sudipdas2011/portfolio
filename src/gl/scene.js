import * as THREE from 'three';
import { config, PROJECTS, IMAGES } from './config.js';

export function createCarousel(canvas, { onActiveChange }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(config.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = config.cameraZ;

  const textureLoader = new THREE.TextureLoader();
  const group = new THREE.Group();
  scene.add(group);

  // --- Shaders ---
  const vertexShader = `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uBend;
    void main() {
      vUv = uv;
      vec3 pos = position;
      // Basic horizontal bend logic based on config
      pos.z += sin(pos.y + uTime) * uBend * 0.1;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uDither;
    uniform float uOpacity;
    
    // Simple Bayer Dither logic
    float dither(vec2 pos) {
      return mod(pos.x + pos.y * 2.0, 4.0) / 4.0;
    }

    void main() {
      vec4 tex = texture2D(uTexture, vUv);
      if (dither(gl_FragCoord.xy) > uDither) discard;
      gl_FragColor = vec4(tex.rgb, tex.a * uOpacity);
    }
  `;

  // --- Create Cards ---
  const geometry = new THREE.PlaneGeometry(config.cardWidth, config.cardHeight, 32, 32);
  const cards = PROJECTS.map((project, i) => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: textureLoader.load(IMAGES[i % IMAGES.length]) },
        uTime: { value: 0 },
        uBend: { value: config.bend },
        uDither: { value: 1.0 },
        uOpacity: { value: 1.0 }
      },
      vertexShader,
      fragmentShader,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    // Arrange in helix/circle based on config
    const angle = i * config.angleStep;
    mesh.position.x = Math.cos(angle) * config.radius;
    mesh.position.z = Math.sin(angle) * config.radius;
    mesh.position.y = i * config.pitch;
    mesh.lookAt(0, mesh.position.y, 0);
    
    group.add(mesh);
    return mesh;
  });

  // --- Interaction Logic ---
  let scrollY = 0;
  let currentActive = 0;

  const handleWheel = (e) => {
    scrollY += e.deltaY * config.wheelStrength;
    
    // Calculate which card is central
    const newActive = Math.round(scrollY / config.angleStep) % PROJECTS.length;
    const normalizedActive = ((newActive % PROJECTS.length) + PROJECTS.length) % PROJECTS.length;
    
    if (normalizedActive !== currentActive) {
      currentActive = normalizedActive;
      onActiveChange(currentActive);
    }
  };

  window.addEventListener('wheel', handleWheel);

  // --- Animation Loop ---
  let animationId;
  const clock = new THREE.Clock();

  const animate = () => {
    const elapsed = clock.getElapsedTime();
    animationId = requestAnimationFrame(animate);
    
    // Rotate the whole group based on scroll
    group.rotation.y = -scrollY;
    
    cards.forEach((card) => {
      card.material.uniforms.uTime.value = elapsed;
    });

    renderer.render(scene, camera);
  };
  animate();

  // --- Resize Handler ---
  const handleResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', handleResize);

  // --- Cleanup ---
  return () => {
    cancelAnimationFrame(animationId);
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('resize', handleResize);
    
    renderer.dispose();
    geometry.dispose();
    cards.forEach(card => {
      card.material.uniforms.uTexture.value.dispose();
      card.material.dispose();
    });
  };
}