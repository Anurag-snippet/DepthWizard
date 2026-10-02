import { Router } from 'express';

const router = Router();

// In-memory store for projects until MongoDB is hooked
const projectsStore = [];

router.get('/', (req, res) => {
  res.json({
    success: true,
    count: projectsStore.length,
    projects: projectsStore,
  });
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  const newProject = {
    id: `proj_${Date.now()}`,
    name: name || 'Untitled Geospatial Project',
    description: description || '',
    createdAt: new Date().toISOString(),
    status: 'initialized',
  };
  projectsStore.push(newProject);

  res.status(201).json({
    success: true,
    project: newProject,
  });
});

export default router;
