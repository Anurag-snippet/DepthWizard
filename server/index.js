import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import fs from 'fs';
import { config } from './src/config/index.js';
import { connectDB } from './src/config/db.js';
import apiRoutes from './src/routes/index.js';
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();

// Initialize MongoDB Connection
connectDB().catch((err) => console.error('[DepthWizard] DB initialization error:', err.message));


// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Global Middlewares
const corsOrigin = config.isProduction
  ? (origin, callback) => (!origin || config.allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Origin is not allowed by CORS policy.')))
  : true;
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: `${config.maxFileSizeMb}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.maxFileSizeMb}mb` }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Source uploads remain private. Public result URLs are served by the AI service
// from its separately managed output store after successful processing.

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

const shutdown = (signal) => {
  console.log(`[DepthWizard Backend] ${signal} received; closing HTTP server.`);
  server.close((error) => {
    if (error) { console.error('[DepthWizard Backend] Shutdown error:', error); process.exitCode = 1; }
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

export default app;
