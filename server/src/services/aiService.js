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
      const response = await this.client.get('/api/inference/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async estimateDepth(imageBuffer, filename, colormap = 'turbo') {
    const formData = new FormData();
    formData.append('image', imageBuffer, { filename: filename || 'image.png' });

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
