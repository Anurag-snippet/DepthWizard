import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { isMongoConnected } from '../config/db.js';
import { aiService } from '../services/aiService.js';
import { projectStore } from '../services/projectStore.js';

const router = Router();
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.geotiff']);
const safeId = (value) => /^[a-zA-Z0-9_-]+$/.test(value || '');

const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const valid = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    callback(valid ? null : new Error('Unsupported image type. Use PNG, JPG, JPEG, TIFF, or GeoTIFF.'), valid);
  },
});

const publicResult = (result) => {
  if (!result) return result;
  const { raw_output_location, ...safeResult } = result;
  return safeResult;
};

const projectResponse = (project) => {
  if (!project) return null;
  const { uploadPath, referenceDemPath, gcpJson, processing, ...safeProject } = project;
  return {
    ...safeProject,
    processing: processing ? { ...processing, result: publicResult(processing.result) } : null,
  };
};

// GET /api/projects — List all projects
router.get('/', async (_req, res, next) => {
  try {
    const rawProjects = await projectStore.list();
    const projects = rawProjects.map(projectResponse);
    res.json({
      success: true,
      persistence: isMongoConnected() ? 'mongodb-atlas' : 'local-file-fallback',
      database: isMongoConnected() ? 'connected' : 'disconnected',
      count: projects.length,
      projects,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects — Upload a single satellite image
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'referenceDem', maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const image = req.files?.image?.[0];
      const referenceDem = req.files?.referenceDem?.[0];

      if (!image) {
        return res.status(400).json({
          success: false,
          error: { code: 'IMAGE_REQUIRED', message: 'Upload an image in the image field.' },
        });
      }

      const project = {
        id: `proj_${crypto.randomUUID()}`,
        name: String(req.body.name || path.parse(image.originalname).name).slice(0, 160),
        description: String(req.body.description || '').slice(0, 2000),
        mode: req.body.mode || (referenceDem ? 'calibrated' : 'relative'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'uploaded',
        stage: 'ready_for_inference',
        processing: null,
        uploadPath: image.path,
        originalFilename: path.basename(image.originalname),
        mimeType: image.mimetype,
        fileSize: image.size,
        referenceDemPath: referenceDem?.path || null,
        referenceDemFilename: referenceDem ? path.basename(referenceDem.originalname) : null,
        referenceDemType: req.body.referenceDemType || null,
        gcpJson: req.body.gcpJson || null,
        metadata: {
          filename: path.basename(image.originalname),
          fileSize: image.size,
        },
      };

      const saved = await projectStore.save(project);
      return res.status(201).json({ success: true, project: projectResponse(saved) });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/projects/:id — Get project by ID
router.get('/:id', async (req, res, next) => {
  try {
    if (!safeId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROJECT_ID', message: 'Invalid project identifier.' },
      });
    }

    const project = await projectStore.get(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' },
      });
    }

    return res.json({ success: true, project: projectResponse(project) });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id — Update project (save results, annotations, stats)
router.put('/:id', async (req, res, next) => {
  try {
    if (!safeId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROJECT_ID', message: 'Invalid project identifier.' },
      });
    }

    const existing = await projectStore.get(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' },
      });
    }

    // Merge allowed updates
    const allowedFields = [
      'name',
      'description',
      'mode',
      'status',
      'stage',
      'depthMapSrc',
      'grayscaleDepthSrc',
      'rawDisparitySrc',
      'elevationMapSrc',
      'elevationRawSrc',
      'imageSrc',
      'inferenceStats',
      'metadata',
      'processing',
    ];

    const updates = { ...existing };
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    updates.updatedAt = new Date().toISOString();

    const saved = await projectStore.save(updates);
    return res.json({ success: true, project: projectResponse(saved) });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/process — Trigger background AI processing
router.post('/:id/process', async (req, res, next) => {
  try {
    const project = await projectStore.get(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' },
      });
    }

    if (project.status === 'processing' || project.status === 'queued') {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_PROCESSING', message: 'This project already has a processing job.' },
      });
    }

    if (!fs.existsSync(project.uploadPath)) {
      return res.status(410).json({
        success: false,
        error: { code: 'SOURCE_MISSING', message: 'The uploaded source image is no longer available on disk.' },
      });
    }

    const processing = {
      id: `proc_${crypto.randomUUID()}`,
      status: 'queued',
      queuedAt: new Date().toISOString(),
      colormap: req.body?.colormap || 'turbo',
    };

    project.status = 'queued';
    project.updatedAt = processing.queuedAt;
    project.processing = processing;
    await projectStore.save(project);

    res.status(202).json({ success: true, processing });

    // Process asynchronously in background
    setImmediate(async () => {
      const latest = await projectStore.get(project.id);
      if (!latest) return;
      latest.status = 'processing';
      latest.processing.status = 'processing';
      latest.processing.startedAt = new Date().toISOString();
      await projectStore.save(latest);

      try {
        const result = await aiService.estimateDepth(
          fs.readFileSync(latest.uploadPath),
          latest.originalFilename,
          latest.processing.colormap,
          latest.referenceDemPath ? fs.readFileSync(latest.referenceDemPath) : null,
          latest.referenceDemFilename,
          latest.gcpJson
        );

        latest.status = 'completed';
        latest.stage = 'depth_ready';
        latest.processing = {
          ...latest.processing,
          status: 'completed',
          completedAt: new Date().toISOString(),
          result,
        };
        latest.depthMapSrc = result.depth_map_preview_url;
        latest.grayscaleDepthSrc = result.grayscale_preview_url;
        latest.rawDisparitySrc = result.raw_npy_download_url;
        latest.inferenceStats = {
          inferenceDurationMs: result.inference_duration_ms,
          totalDurationMs: result.total_processing_duration_ms,
          predictionDimensions: result.prediction_dimensions,
          modelName: result.model_name || 'MiDaS v2.1 Small (TFLite)',
          outputType: result.output_type || 'relative_disparity',
          statistics: result.statistics,
        };
        latest.updatedAt = new Date().toISOString();
        await projectStore.save(latest);
      } catch (error) {
        latest.status = 'failed';
        latest.processing = {
          ...latest.processing,
          status: 'failed',
          failedAt: new Date().toISOString(),
          error: error.response?.data?.detail || error.message,
        };
        latest.updatedAt = new Date().toISOString();
        await projectStore.save(latest);
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/status — Check status of job
router.get('/:id/status', async (req, res, next) => {
  try {
    const project = await projectStore.get(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' },
      });
    }
    const { processing } = projectResponse(project);
    return res.json({ success: true, projectId: project.id, status: project.status, processing });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/results — Get results
router.get('/:id/results', async (req, res, next) => {
  try {
    const project = await projectStore.get(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' },
      });
    }
    if (project.status !== 'completed') {
      return res.status(409).json({
        success: false,
        error: { code: 'RESULTS_NOT_READY', message: 'Inference results are not ready.', status: project.status },
      });
    }
    return res.json({
      success: true,
      projectId: project.id,
      result: publicResult(project.processing?.result),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id — Delete project
router.delete('/:id', async (req, res, next) => {
  try {
    if (!safeId(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PROJECT_ID', message: 'Invalid project identifier.' },
      });
    }
    const project = await projectStore.remove(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' },
      });
    }

    for (const filePath of [project.uploadPath, project.referenceDemPath]) {
      if (filePath && path.dirname(path.resolve(filePath)) === path.resolve(config.uploadDir)) {
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
      }
    }

    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
