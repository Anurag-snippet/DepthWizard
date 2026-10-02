import mongoose from 'mongoose';
import { config } from './index.js';

let isConnected = false;

export async function connectDB() {
  if (!config.mongoUri) {
    console.warn('[DepthWizard DB] No MONGODB_URI provided. File persistence will be used.');
    return false;
  }

  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 10000,
    });

    isConnected = true;
    console.log(`[DepthWizard DB] MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('[DepthWizard DB] MongoDB runtime error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[DepthWizard DB] MongoDB disconnected. Falling back to local storage.');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DepthWizard DB] MongoDB reconnected.');
      isConnected = true;
    });

    return true;
  } catch (error) {
    console.warn(`[DepthWizard DB] MongoDB connection failed: ${error.message}. Local file fallback active.`);
    isConnected = false;
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}
