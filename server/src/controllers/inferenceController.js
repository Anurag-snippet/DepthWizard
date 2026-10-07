/**
 * DepthWizard Inference Controller
 * Proxies image uploads to the Python AI service and returns structured results.
 */
import { aiService } from '../services/aiService.js';
import fs from 'fs';

/**
 * POST /api/inference/depth
 * Accepts multipart/form-data with `image` field, forwards to AI service.
 */
export async function runDepthInference(req, res, _next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded. Use multipart/form-data with field name "image".',
      });
    }

    const colormap = req.query.colormap || req.body.colormap || 'turbo';
    const { path: filePath, originalname } = req.file;

    // Read uploaded buffer from disk
    const imageBuffer = fs.readFileSync(filePath);

    // Forward to AI microservice
    const aiResult = await aiService.estimateDepth(imageBuffer, originalname, colormap);

    // Clean up temp upload file
    try {
      fs.unlinkSync(filePath);
    } catch (_) {}

    return res.json({
      success: true,
      ...aiResult,
    });
  } catch (error) {
    // Clean up on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    const statusCode = error.response?.status || 500;
    const detail = error.response?.data?.detail || error.message;
    return res.status(statusCode).json({
      success: false,
      error: 'AI inference failed',
      detail,
    });
  }
}

/**
 * GET /api/inference/health
 * Proxy health check to the AI service with spin-up awareness.
 */
export async function getAiHealth(_req, res) {
  const result = await aiService.checkHealth();
  const normalizedStatus = result.status || 'unavailable';

  if (result.success && normalizedStatus === 'ready') {
    return res.json({ success: true, online: true, status: 'ready', ...result.data });
  }

  return res.json({
    success: false,
    online: false,
    status: normalizedStatus,
    message: result.message || (
      normalizedStatus === 'waking_up'
        ? 'AI service is waking up. Please wait a few seconds while the model initializes.'
        : normalizedStatus === 'loading'
          ? 'AI model is still initializing.'
          : normalizedStatus === 'failed'
            ? 'AI model could not be initialized.'
            : 'AI service is currently unavailable.'
    ),
    error: result.error,
    ...(result.data ? { data: result.data } : {}),
  });
}
