/**
 * DepthWizard Inference Controller
 * Proxies image uploads to the Python AI service and returns structured results.
 */
import { aiService } from '../services/aiService.js';
import fs from 'fs';
import path from 'path';

/**
 * POST /api/inference/depth
 * Accepts multipart/form-data with `image` field, forwards to AI service.
 */
export async function runDepthInference(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file uploaded. Use multipart/form-data with field name "image".',
      });
    }

    const colormap = req.query.colormap || req.body.colormap || 'turbo';
    const { path: filePath, originalname, mimetype } = req.file;

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
      try { fs.unlinkSync(req.file.path); } catch (_) {}
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
 * Proxy health check to the AI service.
 */
export async function getAiHealth(req, res) {
  const result = await aiService.checkHealth();
  if (result.success) {
    return res.json({ success: true, ...result.data });
  }
  return res.status(503).json({ success: false, error: result.error });
}
