import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PointerLockControls, useTexture } from '@react-three/drei';
import { RotateCcw, Eye } from 'lucide-react';
import { buildTerrainMesh } from './terrainMesh';
import { flightPose, sampleTerrainHeight } from './terrainFlight';

function TerrainScene({ meshData, textureUrl, exaggeration, shadingMode, navigationMode, flight, speed, clearance, isMetric, onPick, onTelemetry, onControls, onHover }) {
  const geometry = useMemo(() => { const item = new THREE.BufferGeometry(); item.setAttribute('position', new THREE.BufferAttribute(meshData.positions.slice(), 3)); item.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs.slice(), 2)); item.setIndex(new THREE.BufferAttribute(meshData.indices, 1)); item.computeVertexNormals(); return item; }, [meshData]);
  const controlsRef = useRef(); const keys = useRef({}); const progress = useRef(0); const lastTelemetry = useRef(0); const texture = useTexture(textureUrl || '/samples/alpine_ridge_optical.png');
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => { const positions = geometry.attributes.position; for (let index = 0; index < meshData.baseHeights.length; index += 1) positions.setY(index, meshData.baseHeights[index] * exaggeration); positions.needsUpdate = true; geometry.computeVertexNormals(); }, [exaggeration, geometry, meshData]);
  useEffect(() => { onControls(controlsRef.current); }, [onControls]);
  useEffect(() => { const down = (event) => { keys.current[event.key.toLowerCase()] = true; }; const up = (event) => { keys.current[event.key.toLowerCase()] = false; }; window.addEventListener('keydown', down); window.addEventListener('keyup', up); return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); }; }, []);
  useEffect(() => { if (flight?.restart) progress.current = 0; }, [flight?.restart]);
  useFrame(({ camera }, delta) => {
    if (navigationMode === 'flight' && flight?.start && flight?.end && flight.running) {
      progress.current = Math.min(1, progress.current + delta * speed / 100);
      const pose = flightPose(meshData, flight.start, flight.end, progress.current, clearance, exaggeration);
      const look = flightPose(meshData, flight.start, flight.end, Math.min(1, progress.current + 0.02), clearance, exaggeration);
      camera.position.set(pose.x, pose.y, pose.z); camera.lookAt(look.x, look.y, look.z);
      if (performance.now() - lastTelemetry.current > 100) { lastTelemetry.current = performance.now(); onTelemetry({ x: pose.x, y: pose.y, z: pose.z, terrain: pose.terrain, progress: progress.current }); } return;
    }
    if (navigationMode === 'free') {
      const direction = new THREE.Vector3(); camera.getWorldDirection(direction); direction.y = 0; direction.normalize();
      const right = new THREE.Vector3().crossVectors(direction, camera.up).normalize(); const move = new THREE.Vector3(); const pressed = keys.current;
      if (pressed.w || pressed.arrowup) move.add(direction); if (pressed.s || pressed.arrowdown) move.sub(direction); if (pressed.d || pressed.arrowright) move.add(right); if (pressed.a || pressed.arrowleft) move.sub(right);
      if (pressed.r) move.y += 1; if (pressed.f) move.y -= 1;
      if (move.lengthSq()) camera.position.add(move.normalize().multiplyScalar(speed * delta));
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -100, 100); camera.position.z = THREE.MathUtils.clamp(camera.position.z, -100, 100);
      const terrain = sampleTerrainHeight(meshData, camera.position.x, camera.position.z, exaggeration) ?? 0; camera.position.y = Math.max(camera.position.y, terrain + clearance);
      if (performance.now() - lastTelemetry.current > 100) { lastTelemetry.current = performance.now(); onTelemetry({ x: camera.position.x, y: camera.position.y, z: camera.position.z, terrain, progress: null }); }
    }
  });
  useEffect(() => { texture.colorSpace = THREE.SRGBColorSpace; texture.needsUpdate = true; }, [texture]);
  const textured = shadingMode === 'textured'; const orbitEnabled = navigationMode === 'orbit';
  const readPoint = (event) => { const base = sampleTerrainHeight(meshData, event.point.x, event.point.z, 1) ?? 0; return { x: event.point.x, z: event.point.z, terrain: isMetric ? meshData.min + (base / 35) * (meshData.max - meshData.min) : base / 35 }; };
  return <><mesh geometry={geometry} castShadow receiveShadow onClick={(event) => { event.stopPropagation(); onPick(readPoint(event)); }} onPointerMove={(event) => { event.stopPropagation(); onHover?.(readPoint(event)); }}><meshStandardMaterial map={textured ? texture : null} color={shadingMode === 'elevation' ? '#35b779' : textured ? '#ffffff' : '#4f8cff'} wireframe={shadingMode === 'wireframe'} roughness={0.9} metalness={0} side={THREE.DoubleSide} /></mesh>{flight?.start && <mesh position={[flight.start.x, sampleTerrainHeight(meshData, flight.start.x, flight.start.z, exaggeration) + 2, flight.start.z]}><sphereGeometry args={[2, 16, 16]} /><meshBasicMaterial color="#22c55e" /></mesh>}{flight?.end && <mesh position={[flight.end.x, sampleTerrainHeight(meshData, flight.end.x, flight.end.z, exaggeration) + 2, flight.end.z]}><sphereGeometry args={[2, 16, 16]} /><meshBasicMaterial color="#f97316" /></mesh>}<axesHelper args={[18]} /><OrbitControls ref={controlsRef} enableDamping enabled={orbitEnabled} minDistance={25} maxDistance={700} maxPolarAngle={Math.PI / 2 - 0.02} />{navigationMode === 'free' && <PointerLockControls />}</>;
}

export default function TerrainCanvas({ textureUrl, raster, rasterWidth, rasterHeight, exaggeration = 1, shadingMode = 'textured', isMetric = false, navigationMode = 'orbit', flight, speed = 40, clearance = 15, quality = 'balanced', onPick, onTelemetry, onHover }) {
  const controlsRef = useRef(null); const maxSide = quality === 'high' ? 384 : quality === 'low' ? 160 : 256; const meshResult = useMemo(() => { try { return { data: buildTerrainMesh(raster, rasterWidth, rasterHeight, { maxSide }), error: null }; } catch (reason) { return { data: null, error: reason.message }; } }, [raster, rasterWidth, rasterHeight, maxSide]); const { data: meshData, error } = meshResult;
  const reset = () => { const controls = controlsRef.current; if (!controls) return; controls.object.position.set(0, 180, 260); controls.target.set(0, 0, 0); controls.update(); };
  const nadir = () => { const controls = controlsRef.current; if (!controls) return; controls.object.position.set(0, 300, 0.01); controls.target.set(0, 0, 0); controls.update(); };
  if (error) return <div className="h-full flex items-center justify-center text-sm text-rose-300 bg-geo-950">Unable to create terrain mesh: {error}</div>;
  if (!meshData) return <div className="h-full flex items-center justify-center text-sm text-slate-300 bg-geo-950">Loading numeric terrain raster…</div>;
  return <div className="relative w-full h-full bg-slate-950 overflow-hidden"><Canvas shadows camera={{ position: [0, 180, 260], fov: 45, near: 0.1, far: 2000 }} gl={{ antialias: true, preserveDrawingBuffer: true }} dpr={[1, 2]} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.15; gl.shadowMap.enabled = true; }}><color attach="background" args={['#172554']} /><fog attach="fog" args={['#172554', 220, 800]} /><hemisphereLight args={['#dbeafe', '#334155', 1.6]} /><directionalLight castShadow position={[150, 250, 100]} intensity={2.2} shadow-mapSize={[2048, 2048]} /><directionalLight position={[-150, 100, -100]} intensity={0.7} color="#bfdbfe" /><Suspense fallback={null}><TerrainScene meshData={meshData} textureUrl={textureUrl} exaggeration={exaggeration} shadingMode={shadingMode} navigationMode={navigationMode} flight={flight} speed={speed} clearance={clearance} isMetric={isMetric} onPick={onPick} onHover={onHover} onTelemetry={onTelemetry} onControls={(controls) => { controlsRef.current = controls; }} /></Suspense></Canvas><div className="absolute top-4 left-4 bg-slate-950/75 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 space-y-1 shadow-lg pointer-events-none"><strong>Terrain mesh</strong><div className="text-[10px] text-slate-300">Grid: {meshData.grid.width}×{meshData.grid.height} · {isMetric ? 'Calibrated elevation' : 'Relative depth'}</div></div><div className="absolute left-4 bottom-4 bg-slate-950/75 border border-white/20 rounded-lg px-2 py-1.5 text-[10px] font-mono text-white pointer-events-none"><strong className="text-blue-200">N ↑</strong><span className="mx-2 text-slate-400">|</span>X / Y / Z axis at origin</div><div className="absolute top-4 right-4 flex space-x-2"><button onClick={nadir} className="bg-white/95 hover:bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm"><Eye className="w-3.5 h-3.5 inline mr-1 text-blue-600" />Nadir</button><button onClick={reset} className="bg-white/95 hover:bg-white text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm"><RotateCcw className="w-3.5 h-3.5 inline mr-1 text-blue-600" />Reset</button></div></div>;
}
