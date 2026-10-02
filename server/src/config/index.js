import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseOrigins = (value) => (value || '').split(',').map((origin) => origin.trim()).filter(Boolean);
const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const storageRoot = process.env.PERSISTENT_STORAGE_DIR || path.resolve(__dirname, '../../');

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  uploadDir: path.resolve(storageRoot, 'uploads'),
  storageDir: path.resolve(storageRoot, 'data'),
  maxFileSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/depthwizard',
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  isProduction,
};
