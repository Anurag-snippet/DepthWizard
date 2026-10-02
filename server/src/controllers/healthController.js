import axios from 'axios';
import { config } from '../config/index.js';
import { isMongoConnected } from '../config/db.js';

export const getHealth = async (_req, res, next) => {
  try {
    let aiServiceStatus = 'unreachable';
    let aiServiceDetails = null;

    try {
      const aiResponse = await axios.get(`${config.aiServiceUrl}/health`, { timeout: 8000 });
      aiServiceStatus = 'connected';
      aiServiceDetails = aiResponse.data;
    } catch {
      try {
        const aiSecondary = await axios.get(`${config.aiServiceUrl}/api/inference/health`, { timeout: 8000 });
        aiServiceStatus = 'connected';
        aiServiceDetails = aiSecondary.data;
      } catch (err) {
        aiServiceStatus = (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) ? 'waking_up' : 'unreachable';
      }
    }

    res.json({
      success: true,
      service: 'DepthWizard Backend Gateway',
      version: '1.0.0-sih26175',
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
    next(error);
  }
};
