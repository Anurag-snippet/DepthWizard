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

export const checkBackendHealth = async () => {
  try {
    const res = await apiClient.get('/health');
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};

export const checkAiHealth = async () => {
  try {
    const res = await axios.get(`${AI_BASE_URL}/health`, { timeout: 5000 });
    return { online: true, data: res.data };
  } catch (error) {
    return { online: false, error: error.message };
  }
};
