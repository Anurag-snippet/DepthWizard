import axios from 'axios';
import { config } from '../config/index.js';

export class AiServiceClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.aiServiceUrl,
      timeout: 60000,
    });
  }

  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async estimateDepth(imagePath, options = {}) {
    // Phase 3 placeholder
    throw new Error('Depth estimation pipeline not yet wired. Scheduled for Phase 3.');
  }
}

export const aiService = new AiServiceClient();
