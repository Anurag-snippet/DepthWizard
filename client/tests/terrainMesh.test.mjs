import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTerrainMesh } from '../src/components/canvas3d/terrainMesh.js';
import { flightPose, sampleTerrainHeight } from '../src/components/canvas3d/terrainFlight.js';

test('flat raster produces a flat indexed mesh', () => {
  const mesh = buildTerrainMesh(new Float32Array(16).fill(7), 4, 4, { maxSide: 4 });
  assert.equal(mesh.indices.length, 54); assert.ok(mesh.baseHeights.every((height) => height === 0));
});
test('ramp preserves ordered vertical displacement', () => {
  const mesh = buildTerrainMesh(new Float32Array([0, 1, 2, 3]), 2, 2, { maxSide: 2 });
  assert.equal(mesh.baseHeights[0], 0); assert.equal(mesh.baseHeights[3], 35);
});
test('invalid samples remove affected faces', () => {
  assert.throws(() => buildTerrainMesh(new Float32Array([1, NaN, 3, 4]), 2, 2, { maxSide: 2 }), /No valid terrain faces/);
});
test('large rasters are downsampled to a bounded grid', () => {
  const mesh = buildTerrainMesh(new Float32Array(1024 * 1024).fill(1), 1024, 1024);
  assert.ok(mesh.grid.width <= 256 && mesh.grid.height <= 256);
});
test('raster corners map consistently to mesh horizontal corners', () => {
  const mesh = buildTerrainMesh(new Float32Array([0, 1, 2, 3]), 2, 2, { maxSide: 2, planeSize: 200 });
  assert.deepEqual(Array.from(mesh.positions.slice(0, 3)), [-100, 0, -100]);
  assert.deepEqual(Array.from(mesh.positions.slice(9, 12)), [100, 35, 100]);
});
test('flight stays above sampled terrain and interpolates endpoints', () => {
  const mesh = buildTerrainMesh(new Float32Array([0, 1, 2, 3]), 2, 2, { maxSide: 2 });
  const start = { x: -100, z: -100 }; const end = { x: 100, z: 100 };
  const pose = flightPose(mesh, start, end, 0.5, 20);
  assert.equal(sampleTerrainHeight(mesh, -100, -100), 0);
  assert.ok(pose.y >= pose.terrain + 20);
  assert.deepEqual(flightPose(mesh, start, end, 0, 20).x, -100);
});
