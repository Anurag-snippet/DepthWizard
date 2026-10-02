import { Router } from 'express';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { aiService } from '../services/aiService.js';
import { projectStore } from '../services/projectStore.js';

const router = Router();
const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.geotiff']);
const safeId = (value) => /^[a-zA-Z0-9_-]+$/.test(value || '');
const storage = multer.diskStorage({ destination: config.uploadDir, filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) });
const upload = multer({ storage, limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 }, fileFilter: (_req, file, callback) => { const valid = allowedExtensions.has(path.extname(file.originalname).toLowerCase()); callback(valid ? null : new Error('Unsupported image type. Use PNG, JPG, JPEG, TIFF, or GeoTIFF.'), valid); } });
const publicResult = (result) => {
  if (!result) return result;
  const { raw_output_location, ...safeResult } = result;
  return safeResult;
};
const projectResponse = (project) => {
  const { uploadPath, referenceDemPath, gcpJson, processing, ...safeProject } = project;
  return {
    ...safeProject,
    processing: processing ? { ...processing, result: publicResult(processing.result) } : null,
  };
};

router.get('/', (_req, res) => { const projects = projectStore.list().map(projectResponse); res.json({ success: true, persistence: 'local-file-fallback', count: projects.length, projects }); });
router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'referenceDem', maxCount: 1 }]), (req, res) => {
  const image = req.files?.image?.[0];
  const referenceDem = req.files?.referenceDem?.[0];
  if (!image) return res.status(400).json({ success: false, error: { code: 'IMAGE_REQUIRED', message: 'Upload an image in the image field.' } });
  const project = { id: `proj_${crypto.randomUUID()}`, name: String(req.body.name || path.parse(image.originalname).name).slice(0, 160), description: String(req.body.description || '').slice(0, 2000), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status: 'uploaded', processing: null, uploadPath: image.path, originalFilename: path.basename(image.originalname), mimeType: image.mimetype, fileSize: image.size, referenceDemPath: referenceDem?.path || null, referenceDemFilename: referenceDem ? path.basename(referenceDem.originalname) : null, gcpJson: req.body.gcpJson || null };
  projectStore.save(project); return res.status(201).json({ success: true, project: projectResponse(project) });
});
router.get('/:id', (req, res) => { if (!safeId(req.params.id)) return res.status(400).json({ success: false, error: { code: 'INVALID_PROJECT_ID', message: 'Invalid project identifier.' } }); const project = projectStore.get(req.params.id); if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' } }); return res.json({ success: true, project: projectResponse(project) }); });
router.post('/:id/process', (req, res) => {
  const project = projectStore.get(req.params.id);
  if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' } });
  if (project.status === 'processing' || project.status === 'queued') return res.status(409).json({ success: false, error: { code: 'ALREADY_PROCESSING', message: 'This project already has a processing job.' } });
  if (!fs.existsSync(project.uploadPath)) return res.status(410).json({ success: false, error: { code: 'SOURCE_MISSING', message: 'The uploaded source image is no longer available.' } });
  const processing = { id: `proc_${crypto.randomUUID()}`, status: 'queued', queuedAt: new Date().toISOString(), colormap: req.body?.colormap || 'turbo' };
  project.status = 'queued'; project.updatedAt = processing.queuedAt; project.processing = processing; projectStore.save(project); res.status(202).json({ success: true, processing });
  setImmediate(async () => { const latest = projectStore.get(project.id); if (!latest) return; latest.status = 'processing'; latest.processing.status = 'processing'; latest.processing.startedAt = new Date().toISOString(); projectStore.save(latest); try { const result = await aiService.estimateDepth(fs.readFileSync(latest.uploadPath), latest.originalFilename, latest.processing.colormap, latest.referenceDemPath ? fs.readFileSync(latest.referenceDemPath) : null, latest.referenceDemFilename, latest.gcpJson); latest.status = 'completed'; latest.processing = { ...latest.processing, status: 'completed', completedAt: new Date().toISOString(), result }; latest.updatedAt = new Date().toISOString(); projectStore.save(latest); } catch (error) { latest.status = 'failed'; latest.processing = { ...latest.processing, status: 'failed', failedAt: new Date().toISOString(), error: error.response?.data?.detail || error.message }; latest.updatedAt = new Date().toISOString(); projectStore.save(latest); } });
});
router.get('/:id/status', (req, res) => { const project = projectStore.get(req.params.id); if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' } }); const { processing } = projectResponse(project); return res.json({ success: true, projectId: project.id, status: project.status, processing }); });
router.get('/:id/results', (req, res) => { const project = projectStore.get(req.params.id); if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' } }); if (project.status !== 'completed') return res.status(409).json({ success: false, error: { code: 'RESULTS_NOT_READY', message: 'Inference results are not ready.', status: project.status } }); return res.json({ success: true, projectId: project.id, result: publicResult(project.processing.result) }); });
router.delete('/:id', (req, res) => { if (!safeId(req.params.id)) return res.status(400).json({ success: false, error: { code: 'INVALID_PROJECT_ID', message: 'Invalid project identifier.' } }); const project = projectStore.remove(req.params.id); if (!project) return res.status(404).json({ success: false, error: { code: 'PROJECT_NOT_FOUND', message: 'Project was not found.' } }); for (const filePath of [project.uploadPath, project.referenceDemPath]) { if (filePath && path.dirname(path.resolve(filePath)) === path.resolve(config.uploadDir)) { try { fs.unlinkSync(filePath); } catch {} } } return res.status(204).end(); });
export default router;
