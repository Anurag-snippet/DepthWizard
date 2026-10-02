import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import projectRoutes from './projectRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/projects', projectRoutes);

export default router;
