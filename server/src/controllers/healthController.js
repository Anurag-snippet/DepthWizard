import axios from 'axios';
import { config } from '../config/index.js';
import { isMongoConnected } from '../config/db.js';

export const getHealth = async (_req, res, next) => {
  try {
    const aiResponse = await axios.get(`${config.aiServiceUrl}/health`, { timeout: 8000 });
    const aiDetails = aiResponse.data || {};

    let aiServiceStatus = 'unavailable';
    let aiServiceDetails = aiDetails;

    if (aiDetails.status === 'healthy') {
      try {
        const readyResponse = await axios.get(`${config.aiServiceUrl}/ready`, { timeout: 10000 });
        const readyData = readyResponse.data || {};
        aiServiceStatus = readyData.status === 'ready' ? 'ready' : (readyData.status === 'loading' ? 'loading' : (readyData.status === 'failed' ? 'failed' : 'waking_up'));
        aiServiceDetails = readyData;
      } catch (readyError) {
        if (readyError.response?.data) {
          const readyData = readyError.response.data;
          aiServiceStatus = readyData.status === 'loading' ? 'loading' : (readyData.status === 'failed' ? 'failed' : 'waking_up');
          aiServiceDetails = readyData;
        } else {
          aiServiceStatus = (readyError.code === 'ECONNABORTED' || readyError.message?.includes('timeout')) ? 'waking_up' : 'unavailable';
        }
      }
    }

    res.json({
      success: true,
      service: 'DepthWizard Backend Gateway',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      port: config.port,
      database: {
        status: isMongoConnected() ? 'connected' : 'disconnected',
        provider: isMongoConnected() ? 'MongoDB Atlas' : 'Local File Persistence Fallback',
      },
      aiService: {
        url: config.aiServiceUrl,
        status: aiServiceStatus,
        details: aiServiceDetails,
      },
    });
  } catch (error) {
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    res.json({
      success: true,
      service: 'DepthWizard Backend Gateway',
      version: '1.0.0',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      port: config.port,
      database: {
        status: isMongoConnected() ? 'connected' : 'disconnected',
        provider: isMongoConnected() ? 'MongoDB Atlas' : 'Local File Persistence Fallback',
      },
      aiService: {
        url: config.aiServiceUrl,
        status: isTimeout ? 'waking_up' : 'unavailable',
        details: error.response?.data || null,
        error: error.message,
      },
    });
  }
};
