import axios from 'axios';
import { config } from '../config/index.js';

export const getHealth = async (req, res, next) => {
  try {
    let aiServiceStatus = 'unreachable';
    let aiServiceDetails = null;

    try {
      const aiResponse = await axios.get(`${config.aiServiceUrl}/health`, { timeout: 3000 });
      aiServiceStatus = 'connected';
      aiServiceDetails = aiResponse.data;
    } catch {
      aiServiceStatus = 'unreachable';
    }

    res.json({
      success: true,
      service: 'DepthWizard Backend Gateway',
      version: '1.0.0-sih26175',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      port: config.port,
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
