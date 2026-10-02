import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  uploadDir: path.resolve(__dirname, '../../uploads'),
  storageDir: path.resolve(__dirname, '../../data'),
  maxFileSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/depthwizard',
};
