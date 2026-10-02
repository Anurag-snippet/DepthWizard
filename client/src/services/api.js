/**
 * DepthWizard Frontend API Service
 * All backend calls go through the Express proxy (port 5000),
 * which in turn forwards to the Python AI service (port 8000).
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Health check — Express backend */
export const checkBackendHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

/** Health check — AI service (via proxy) */
export const checkAiHealth = async () => {
  try {
    const res = await apiClient.get('/inference/health', { timeout: 8000 });
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

/**
 * Run monocular depth estimation.
 * @param {File|Blob} imageFile  - File object from input or Blob from dataURL
 * @param {string}    filename   - Original filename for the AI service
 * @param {string}    colormap   - 'turbo' | 'viridis' | 'inferno' | 'grayscale'
 * @returns {Promise<object>}    - AI service response with depth_map_preview_url etc.
 */
export const runDepthInference = async (imageFile, filename, colormap = 'turbo') => {
  const formData = new FormData();
  formData.append('image', imageFile, filename || 'image.png');

  const res = await axios.post(
    `${API_BASE_URL}/inference/depth?colormap=${encodeURIComponent(colormap)}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 180000, // 3 min for large images
    }
  );
  return res.data;
};

/**
 * Convert a base64 dataURL to a Blob suitable for FormData.
 * @param {string} dataUrl - data:image/png;base64,...
 * @returns {Blob}
 */
export const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
};

/**
 * Apply linear metric calibration: scale relative disparity [0,1] to metres
 * using provided min/max elevation bounds from reference DEM or GCPs.
 *
 * SIH COMPLIANCE: This is the ONLY path where metres are presented to the user.
 * Uncalibrated disparity is strictly never labelled as absolute elevation.
 *
 * @param {number} disparity   - Normalized value [0, 1]
 * @param {number} minMeters   - Lower bound in metres (from reference DEM)
 * @param {number} maxMeters   - Upper bound in metres (from reference DEM)
 * @returns {number}           - Calibrated elevation in metres
 */
export const calibrateElevation = (disparity, minMeters, maxMeters) => {
  return minMeters + disparity * (maxMeters - minMeters);
};
