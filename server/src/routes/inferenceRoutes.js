import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { config } from '../config/index.js';
import { runDepthInference, getAiHealth } from '../controllers/inferenceController.js';

const router = Router();

// Disk storage: write to uploads dir, keep original extension
const storage = multer.diskStorage({
  destination: config.uploadDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `upload_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.tif', '.tiff', '.geotiff'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${ext}. Supported: JPG, PNG, GeoTIFF`));
    }
  },
});

// POST /api/inference/depth — run monocular depth estimation
router.post('/depth', upload.single('image'), runDepthInference);

// GET /api/inference/health — proxy AI health
router.get('/health', getAiHealth);

export default router;
