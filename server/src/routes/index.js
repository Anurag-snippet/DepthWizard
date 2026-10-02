import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import projectRoutes from './projectRoutes.js';
import inferenceRoutes from './inferenceRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/projects', projectRoutes);
router.use('/inference', inferenceRoutes);

export default router;
