/**
 * DepthWizard Frontend API Service
 * All backend calls go through the Express proxy (port 5000),
 * which in turn forwards to the Python AI service (port 8000) and MongoDB Atlas.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_BASE_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

/** Resolve an AI static-output path using the environment-configured service URL. */
export const resolveAiUrl = (relativePath) => {
  if (!relativePath || relativePath.startsWith('http')) return relativePath || null;
  return `${AI_BASE_URL}${relativePath}`;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Health check — Express backend and MongoDB status */
export const checkBackendHealth = async () => {
  try {
    const res = await apiClient.get('/health', { timeout: 10000 });
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

/** Health check — AI service (via proxy with spin-up awareness) */
export const checkAiHealth = async () => {
  try {
    const res = await apiClient.get('/inference/health', { timeout: 12000 });
    if (res.data?.online === true || res.data?.status === 'healthy') {
      return { online: true, status: 'online', data: res.data };
    }
    return {
      online: false,
      status: res.data?.status || 'waking_up',
      data: res.data,
      message: res.data?.message || 'AI service waking up...',
    };
  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    return {
      online: false,
      status: isTimeout ? 'waking_up' : 'offline',
      error: error.message,
    };
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

/** Create a server-backed project and securely upload its source image. */
export const createProject = async ({ imageFile, referenceDemFile, name, description, mode }) => {
  const formData = new FormData();
  formData.append('image', imageFile, imageFile.name || 'image.png');
  formData.append('name', name || 'Untitled Geospatial Project');
  formData.append('description', description || '');
  if (mode) formData.append('mode', mode);
  if (referenceDemFile) formData.append('referenceDem', referenceDemFile, referenceDemFile.name);
  const res = await axios.post(`${API_BASE_URL}/projects`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data.project;
};

/** Upload multiple satellite images in a single batch. */
export const createBatchProjects = async (imageFiles, mode = 'relative', description = '') => {
  const formData = new FormData();
  for (const file of imageFiles) {
    formData.append('images', file, file.name);
  }
  formData.append('mode', mode);
  if (description) formData.append('description', description);

  const res = await axios.post(`${API_BASE_URL}/projects/batch`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return res.data;
};

/** Fetch all projects stored in remote MongoDB / backend. */
export const fetchRemoteProjects = async () => {
  try {
    const res = await apiClient.get('/projects');
    return res.data.projects || [];
  } catch (error) {
    console.warn('[DepthWizard] Failed to fetch remote projects:', error.message);
    return [];
  }
};

/** Update an existing project in remote MongoDB / backend. */
export const updateProjectApi = async (projectId, updates) => {
  try {
    const res = await apiClient.put(`/projects/${encodeURIComponent(projectId)}`, updates);
    return res.data.project;
  } catch (error) {
    console.warn(`[DepthWizard] Failed to update remote project ${projectId}:`, error.message);
    return null;
  }
};

/** Delete a project from backend / MongoDB. */
export const deleteRemoteProject = async (projectId) => {
  try {
    await apiClient.delete(`/projects/${encodeURIComponent(projectId)}`);
    return true;
  } catch (error) {
    console.warn(`[DepthWizard] Failed to delete remote project ${projectId}:`, error.message);
    return false;
  }
};

export const startProjectProcessing = async (projectId, colormap) =>
  (await apiClient.post(`/projects/${encodeURIComponent(projectId)}/process`, { colormap }, { timeout: 15000 })).data;
export const getProjectStatus = async (projectId) =>
  (await apiClient.get(`/projects/${encodeURIComponent(projectId)}/status`, { timeout: 10000 })).data;
export const getProjectResults = async (projectId) =>
  (await apiClient.get(`/projects/${encodeURIComponent(projectId)}/results`, { timeout: 15000 })).data;

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
 */
export const calibrateElevation = (disparity, minMeters, maxMeters) => {
  return minMeters + disparity * (maxMeters - minMeters);
};
