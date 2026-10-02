import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/index.js';

export class AiServiceClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.aiServiceUrl,
      timeout: 120000,
    });
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/api/inference/health', { timeout: 10000 });
      return { success: true, data: response.data };
    } catch (primaryErr) {
      try {
        const fallback = await this.client.get('/health', { timeout: 10000 });
        return { success: true, data: fallback.data };
      } catch (fallbackErr) {
        const isTimeout = fallbackErr.code === 'ECONNABORTED' || fallbackErr.message?.includes('timeout');
        return {
          success: false,
          status: isTimeout ? 'waking_up' : 'unreachable',
          error: fallbackErr.message || primaryErr.message,
        };
      }
    }
  }

  async estimateDepth(imageBuffer, filename, colormap = 'turbo', referenceDemBuffer = null, referenceDemFilename = null, gcpJson = null) {
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: filename || 'image.png' });
    if (referenceDemBuffer) formData.append('reference_dem', referenceDemBuffer, { filename: referenceDemFilename || 'reference_dem.tif' });
    if (gcpJson) formData.append('gcp_json', gcpJson);

    const response = await this.client.post(
      `/api/inference/depth?colormap=${encodeURIComponent(colormap)}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );
    return response.data;
  }
}

export const aiService = new AiServiceClient();
