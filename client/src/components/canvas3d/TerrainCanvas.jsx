import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Eye } from 'lucide-react';

const GRID_RES   = 128; // vertices per side
const PLANE_SIZE = 200; // world units

/**
 * TerrainCanvas — Three.js WebGL monocular depth terrain renderer.
 *
 * Accepts a greyscale/coloured depthUrl and displaces a PlaneGeometry based on
 * the luminance value of each pixel.  Height = pixel_luminance × 35 × exaggeration.
 *
 * The textureUrl (original satellite image) is applied as the diffuse map in
 * 'textured' shading mode.
 */
export default function TerrainCanvas({
  textureUrl,
  depthUrl,
  exaggeration = 1.0,
  shadingMode  = 'textured', // 'textured' | 'wireframe' | 'elevation'
  isFlythrough = false,
  isMetric     = false,
  minElev      = 0,
  maxElev      = 1000,
}) {
  const containerRef    = useRef(null);
  const sceneRef        = useRef(null);
  const rendererRef     = useRef(null);
  const cameraRef       = useRef(null);
  const controlsRef     = useRef(null);
  const meshRef         = useRef(null);
  const geomRef         = useRef(null);
  const rawHeightsRef   = useRef(null); // raw luminance [0..1] per vertex
  const animFrameIdRef  = useRef(null);
  const flyAngleRef     = useRef(0);
  const isFlyRef        = useRef(isFlythrough);
  const exagRef         = useRef(exaggeration);

  const [fps, setFps] = useState(60);

  // ─── Main Scene Setup (runs once per textureUrl/depthUrl change) ──────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── 1. Scene ──
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070a12);
    scene.fog = new THREE.FogExp2(0x070a12, 0.003);
    sceneRef.current = scene;

    // ── 2. Camera ──
    const width  = container.clientWidth  || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 180, 260);
    cameraRef.current = camera;

    // ── 3. Renderer ──
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── 4. Controls ──
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.05;
    controls.maxPolarAngle  = Math.PI / 2 - 0.05;
    controls.minDistance    = 20;
    controls.maxDistance    = 700;
    controlsRef.current     = controls;

    // ── 5. Lighting ──
    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.4);
    sun.position.set(150, 250, 100);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x7090b0, 0.5);
    fill.position.set(-150, 100, -100);
    scene.add(fill);

    // ── 6. Grid ──
    const grid = new THREE.GridHelper(260, 26, 0x1e2b45, 0x111726);
    grid.position.y = -2;
    scene.add(grid);

    // ── 7. Terrain Geometry ──
    const geometry = new THREE.PlaneGeometry(
      PLANE_SIZE, PLANE_SIZE,
      GRID_RES - 1, GRID_RES - 1
    );
    geometry.rotateX(-Math.PI / 2);
    geomRef.current = geometry;

    // Default procedural displacement until depth image loads
    const pos = geometry.attributes.position;
    const defaultHeights = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const d  = Math.sqrt(vx * vx + vz * vz) / 100;
      defaultHeights[i] = Math.max(0, 1 - d) *
        (Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 0.5 + Math.sin(vx * 0.12) * 0.3);
      pos.setY(i, defaultHeights[i] * 35 * exagRef.current);
    }
    rawHeightsRef.current = defaultHeights;
    geometry.computeVertexNormals();

    // ── 8. Material & Mesh ──
    const textureLoader = new THREE.TextureLoader();
    const material = new THREE.MeshStandardMaterial({
      color: 0x90a4ae,
      roughness: 0.85,
      metalness: 0.05,
      wireframe: shadingMode === 'wireframe',
    });

    if (textureUrl && shadingMode !== 'wireframe') {
      material.map = textureLoader.load(textureUrl, () => { material.needsUpdate = true; });
    }

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // ── 9. Load depth map ──
    if (depthUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = depthUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = GRID_RES;
        canvas.height = GRID_RES;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, GRID_RES, GRID_RES);
        const data = ctx.getImageData(0, 0, GRID_RES, GRID_RES).data;

        const p       = geomRef.current?.attributes.position;
        const heights = new Float32Array(p.count);
        if (!p) return;

        for (let i = 0; i < p.count; i++) {
          const px  = i * 4;
          // Luminance from RGB
          const lum = (data[px] * 0.299 + data[px + 1] * 0.587 + data[px + 2] * 0.114) / 255.0;
          heights[i] = lum;
          p.setY(i, lum * 35 * exagRef.current);
        }
        rawHeightsRef.current = heights;
        p.needsUpdate = true;
        geomRef.current.computeVertexNormals();
      };
      img.onerror = () => {
        console.warn('[TerrainCanvas] Depth image failed to load:', depthUrl);
      };
    }

    // ── 10. Animation Loop ──
    let lastTime   = performance.now();
    let frameCount = 0;

    const animate = (time) => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      frameCount++;
      if (time - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime   = time;
      }

      if (isFlyRef.current) {
        flyAngleRef.current += 0.005;
        const r = 200;
        camera.position.x = Math.sin(flyAngleRef.current) * r;
        camera.position.z = Math.cos(flyAngleRef.current) * r;
        camera.position.y = 90 + Math.sin(flyAngleRef.current * 1.5) * 30;
        camera.lookAt(0, 20, 0);
      } else {
        controls.update();
      }

      renderer.render(scene, camera);
    };
    animFrameIdRef.current = requestAnimationFrame(animate);

    // ── 11. Resize Observer ──
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textureUrl, depthUrl]); // Re-initialise only when URLs change

  // ─── Sync isFlythrough to ref (no re-init) ──────────────────────────────
  useEffect(() => {
    isFlyRef.current = isFlythrough;
    if (!isFlythrough && controlsRef.current) {
      controlsRef.current.update();
    }
  }, [isFlythrough]);

  // ─── Live exaggeration update (re-apply heights) ─────────────────────────
  useEffect(() => {
    exagRef.current = exaggeration;
    const geom    = geomRef.current;
    const heights = rawHeightsRef.current;
    if (!geom || !heights) return;

    const p = geom.attributes.position;
    for (let i = 0; i < p.count; i++) {
      p.setY(i, heights[i] * 35 * exaggeration);
    }
    p.needsUpdate = true;
    geom.computeVertexNormals();
  }, [exaggeration]);

  // ─── Shading mode update ─────────────────────────────────────────────────
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const mat = mesh.material;

    if (shadingMode === 'wireframe') {
      mat.wireframe = true;
      mat.color.setHex(0x38bdf8);
      mat.map = null;
    } else if (shadingMode === 'elevation') {
      mat.wireframe = false;
      mat.color.setHex(0x2dd4bf);
      mat.map = null;
    } else {
      // textured
      mat.wireframe = false;
      mat.color.setHex(0xffffff);
      if (textureUrl && !mat.map) {
        mat.map = new THREE.TextureLoader().load(textureUrl);
      }
    }
    mat.needsUpdate = true;
  }, [shadingMode, textureUrl]);

  // ─── Camera controls ─────────────────────────────────────────────────────
  const resetCamera = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 180, 260);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  const setNadirView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(0, 300, 0.001);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-geo-950 overflow-hidden select-none">
      {/* WebGL Canvas */}
      <div ref={containerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Telemetry HUD */}
      <div className="absolute top-4 left-4 bg-geo-900/80 backdrop-blur-md border border-geo-700/60 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 space-y-1 shadow-lg pointer-events-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-white">Three.js WebGL Engine</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center space-x-3">
          <span>FPS: <strong className="text-cyan-300">{fps}</strong></span>
          <span>Grid: {GRID_RES}×{GRID_RES} verts</span>
          <span>Exagg: <strong className="text-blue-300">{exaggeration.toFixed(1)}×</strong></span>
          <span className={isMetric ? 'text-emerald-400' : 'text-amber-400'}>
            {isMetric ? 'Metric' : 'Relative'}
          </span>
        </div>
      </div>

      {/* Camera Controls */}
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
