export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/** Bilinear height sample in terrain world coordinates; returns null over invalid cells. */
export function sampleTerrainHeight(mesh, x, z, exaggeration = 1) {
  const { grid, baseHeights } = mesh;
  const u = clamp((x + 100) / 200, 0, 1) * (grid.width - 1);
  const v = clamp((z + 100) / 200, 0, 1) * (grid.height - 1);
  const c0 = Math.floor(u); const r0 = Math.floor(v); const c1 = Math.min(c0 + 1, grid.width - 1); const r1 = Math.min(r0 + 1, grid.height - 1);
  const tx = u - c0; const ty = v - r0;
  const a = baseHeights[r0 * grid.width + c0]; const b = baseHeights[r0 * grid.width + c1]; const c = baseHeights[r1 * grid.width + c0]; const d = baseHeights[r1 * grid.width + c1];
  if (![a, b, c, d].every(Number.isFinite)) return null;
  return ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty) * exaggeration;
}

export function flightPose(mesh, start, end, progress, clearance, exaggeration = 1) {
  const t = clamp(progress, 0, 1); const smooth = t * t * (3 - 2 * t);
  const x = start.x + (end.x - start.x) * smooth; const z = start.z + (end.z - start.z) * smooth;
  const terrain = sampleTerrainHeight(mesh, x, z, exaggeration) ?? 0;
  const arch = Math.sin(Math.PI * t) * clearance * 0.5;
  return { x, z, y: terrain + clearance + arch, terrain };
}
