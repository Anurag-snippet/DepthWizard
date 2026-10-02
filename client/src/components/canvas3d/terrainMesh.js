const MAX_GRID_SIDE = 256;
const PLANE_SIZE = 200;

export function chooseGridDimensions(width, height, maxSide = MAX_GRID_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.max(2, Math.round(width * scale)), height: Math.max(2, Math.round(height * scale)) };
}

/** Builds a bounded grid mesh from the actual numeric depth/elevation raster. */
export function buildTerrainMesh(raster, sourceWidth, sourceHeight, { maxSide = MAX_GRID_SIDE, planeSize = PLANE_SIZE } = {}) {
  if (!(raster instanceof Float32Array) || raster.length !== sourceWidth * sourceHeight) throw new Error('Terrain raster dimensions do not match its numeric data.');
  const grid = chooseGridDimensions(sourceWidth, sourceHeight, maxSide);
  let min = Infinity; let max = -Infinity;
  for (const value of raster) if (Number.isFinite(value)) { min = Math.min(min, value); max = Math.max(max, value); }
  if (!Number.isFinite(min)) throw new Error('Terrain raster contains no finite values.');
  const span = Math.max(max - min, 1e-7);
  const positions = new Float32Array(grid.width * grid.height * 3);
  const uvs = new Float32Array(grid.width * grid.height * 2);
  const values = new Float32Array(grid.width * grid.height);
  const valid = new Uint8Array(grid.width * grid.height);
  for (let row = 0; row < grid.height; row += 1) {
    const sourceRow = Math.min(sourceHeight - 1, Math.round((row / (grid.height - 1)) * (sourceHeight - 1)));
    for (let col = 0; col < grid.width; col += 1) {
      const sourceCol = Math.min(sourceWidth - 1, Math.round((col / (grid.width - 1)) * (sourceWidth - 1)));
      const index = row * grid.width + col; const value = raster[sourceRow * sourceWidth + sourceCol];
      const offset = index * 3;
      positions[offset] = (col / (grid.width - 1) - 0.5) * planeSize;
      positions[offset + 1] = Number.isFinite(value) ? ((value - min) / span) * 35 : 0;
      positions[offset + 2] = (row / (grid.height - 1) - 0.5) * planeSize;
      uvs[index * 2] = col / (grid.width - 1);
      uvs[index * 2 + 1] = 1 - row / (grid.height - 1);
      values[index] = value; valid[index] = Number.isFinite(value) ? 1 : 0;
    }
  }
  const indices = [];
  for (let row = 0; row < grid.height - 1; row += 1) for (let col = 0; col < grid.width - 1; col += 1) {
    const a = row * grid.width + col; const b = a + 1; const c = a + grid.width; const d = c + 1;
    if (valid[a] && valid[b] && valid[c] && valid[d]) indices.push(a, c, b, b, c, d);
  }
  if (!indices.length) throw new Error('No valid terrain faces could be created from this raster.');
  return { positions, uvs, indices: new Uint32Array(indices), baseHeights: positions.filter((_, index) => index % 3 === 1), grid, min, max };
}
