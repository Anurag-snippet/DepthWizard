import axios from 'axios';
import FormData from 'form-data';
import { config } from '../config/index.js';

export const mapAiHealthStatus = (responseData = {}, fallbackStatus = 'unavailable') => {
  const rawStatus = responseData.status || responseData.state || fallbackStatus;
  if (rawStatus === 'ready' || responseData.online === true || responseData.model_loaded === true) {
    return { success: true, status: 'ready', data: responseData, message: responseData.message || 'AI service is online.' };
  }
  if (rawStatus === 'loading' || responseData.model_status === 'loading') {
    return { success: false, status: 'loading', data: responseData, message: responseData.message || 'AI model is still initializing.' };
  }
  if (rawStatus === 'failed' || responseData.model_status === 'failed') {
    return { success: false, status: 'failed', data: responseData, message: responseData.message || 'AI model initialization failed.' };
  }
  if (rawStatus === 'waking_up' || responseData.message?.toLowerCase().includes('waking')) {
    return { success: false, status: 'waking_up', data: responseData, message: responseData.message || 'AI service is waking up from Render standby.' };
  }
  if (rawStatus === 'healthy') {
    return { success: false, status: 'loading', data: responseData, message: 'AI service is alive but model readiness is unknown.' };
  }
  return { success: false, status: 'unavailable', data: responseData, message: responseData.message || 'AI service is currently unavailable.' };
};

export class AiServiceClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.aiServiceUrl,
      timeout: 120000,
    });
  }

  async checkHealth() {
    try {
      const healthResponse = await this.client.get('/health', { timeout: 8000 });
      if (healthResponse.data?.status !== 'healthy') {
        return { success: false, status: 'unavailable', data: healthResponse.data, error: 'AI service is not reporting healthy.' };
      }

      try {
        const readyResponse = await this.client.get('/ready', { timeout: 10000 });
        const mapped = mapAiHealthStatus(readyResponse.data, 'loading');
        return { ...mapped, data: readyResponse.data };
      } catch (readyError) {
        if (readyError.response?.data) {
          const mapped = mapAiHealthStatus(readyError.response.data, 'loading');
          return { ...mapped, data: readyError.response.data };
        }
        const isTimeout = readyError.code === 'ECONNABORTED' || readyError.message?.includes('timeout');
        return {
          success: false,
          status: isTimeout ? 'waking_up' : 'unavailable',
          data: readyError.response?.data || null,
          error: readyError.message,
        };
      }
    } catch (primaryErr) {
      const isTimeout = primaryErr.code === 'ECONNABORTED' || primaryErr.message?.includes('timeout');
      return {
        success: false,
        status: isTimeout ? 'waking_up' : 'unavailable',
        data: primaryErr.response?.data || null,
        error: primaryErr.message,
      };
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
