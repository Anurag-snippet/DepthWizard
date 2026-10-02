import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Eye } from 'lucide-react';

export default function TerrainCanvas({
  textureUrl,
  depthUrl,
  exaggeration = 1.0,
  shadingMode = 'textured', // 'textured' | 'wireframe' | 'elevation' | 'shaded'
  isFlythrough = false,
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const meshRef = useRef(null);
  const planeGeomRef = useRef(null);
  const animFrameIdRef = useRef(null);

  const [fps, setFps] = useState(60);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Initialize Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.003);
    sceneRef.current = scene;

    // 2. Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 180, 260);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent going beneath terrain
    controls.minDistance = 20;
    controls.maxDistance = 600;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff8ee, 1.4);
    sunLight.position.set(150, 250, 100);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0x7090b0, 0.5);
    fillLight.position.set(-150, 100, -100);
    scene.add(fillLight);

    // 6. Grid Helper (Scientific bounding boundary)
    const gridHelper = new THREE.GridHelper(260, 26, 0x1e2b45, 0x111726);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // 7. Procedural / Image-based Terrain Mesh
    const gridRes = 128;
    const planeSize = 200;
    const geometry = new THREE.PlaneGeometry(planeSize, planeSize, gridRes - 1, gridRes - 1);
    geometry.rotateX(-Math.PI / 2);
    planeGeomRef.current = geometry;

    // Initial default synthetic elevation displacement
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const dist = Math.sqrt(vx * vx + vz * vz) / 100;
      const elevation = (Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 15 + Math.sin(vx * 0.12) * 8) * Math.max(0, 1 - dist);
      pos.setY(i, elevation);
    }
    geometry.computeVertexNormals();

    const textureLoader = new THREE.TextureLoader();
    let diffuseMap = null;
    if (textureUrl) {
      diffuseMap = textureLoader.load(textureUrl);
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x90a4ae,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: shadingMode === 'wireframe',
      flatShading: false,
      map: diffuseMap,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Load displacement from depth image if available
    if (depthUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = depthUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = gridRes;
        canvas.height = gridRes;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, gridRes, gridRes);
        const imgData = ctx.getImageData(0, 0, gridRes, gridRes).data;

        const p = geometry.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const pixelIndex = i * 4;
          const val = imgData[pixelIndex] / 255.0; // [0, 1] relative depth
          const height = val * 35 * exaggeration;
          p.setY(i, height);
        }
        p.needsUpdate = true;
        geometry.computeVertexNormals();
      };
    }

    // 8. Animation & Render Loop
    let angle = 0;
    let lastTime = performance.now();
    let frameCount = 0;

    const animate = (time) => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = time;
      }

      if (isFlythrough) {
        angle += 0.005;
        const radius = 180;
        camera.position.x = Math.sin(angle) * radius;
        camera.position.z = Math.cos(angle) * radius;
        camera.position.y = 80 + Math.sin(angle * 2) * 25;
        camera.lookAt(0, 15, 0);
      } else {
        controls.update();
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // 9. Resize Observer
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [textureUrl, depthUrl]);

  // Update exaggeration dynamically
  useEffect(() => {
    if (!meshRef.current || !planeGeomRef.current) return;
    const geom = planeGeomRef.current;
    // Recalculate normals
    geom.computeVertexNormals();
  }, [exaggeration]);

  // Update material shading
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    if (shadingMode === 'wireframe') {
      mat.wireframe = true;
      mat.color.setHex(0x38bdf8);
    } else if (shadingMode === 'elevation') {
      mat.wireframe = false;
      mat.color.setHex(0x2dd4bf);
    } else {
      mat.wireframe = false;
      mat.color.setHex(0xffffff);
    }
    mat.needsUpdate = true;
  }, [shadingMode]);

  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 180, 260);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const setNadirView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 280, 0.001);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-geo-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Floating Diagnostics & Telemetry HUD */}
      <div className="absolute top-4 left-4 bg-geo-900/80 backdrop-blur-md border border-geo-700/60 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 space-y-1 shadow-lg pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-white">Three.js WebGL Engine</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center space-x-3">
          <span>FPS: <strong className="text-cyan-300">{fps}</strong></span>
          <span>Grid: 128×128 vertices</span>
          <span>Exagg: <strong className="text-blue-300">{exaggeration.toFixed(1)}×</strong></span>
        </div>
      </div>

      {/* Quick Camera Navigation Overlay */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <button
          onClick={setNadirView}
          title="Top-Down Nadir Ortho View"
          className="bg-geo-900/80 hover:bg-geo-800 text-slate-200 border border-geo-700/60 rounded-lg px-2.5 py-1.5 text-xs font-mono flex items-center space-x-1.5 shadow-lg transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Nadir View</span>
        </button>

        <button
          onClick={resetCamera}
          title="Reset Perspective Camera"
          className="bg-geo-900/80 hover:bg-geo-800 text-slate-200 border border-geo-700/60 rounded-lg px-2.5 py-1.5 text-xs font-mono flex items-center space-x-1.5 shadow-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span>Reset Camera</span>
        </button>
      </div>
    </div>
  );
}
