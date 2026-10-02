import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import { config } from './src/config/index.js';
import apiRoutes from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: `${config.maxFileSizeMb}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.maxFileSizeMb}mb` }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Static serving for uploaded and processed assets
app.use('/uploads', express.static(config.uploadDir));

// API Routes
app.use('/api', apiRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.json({
    project: 'DepthWizard Backend Gateway',
    problemStatement: 'SIH 26175',
    healthCheck: '/api/health',
    status: 'operational',
  });
});

// Centralized error handling
app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`[DepthWizard Backend] Server running on http://localhost:${config.port}`);
  console.log(`[DepthWizard Backend] Configured AI Service endpoint: ${config.aiServiceUrl}`);
});

export default app;
