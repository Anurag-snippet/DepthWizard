/**
 * DepthWizard Project Store
 * Local storage & remote MongoDB persistence layer for genuine project records and statistics.
 * In compliance with SIH standards: No fabricated or hardcoded statistical metrics.
 */
import { updateProjectApi, deleteRemoteProject, fetchRemoteProjects } from './api';

const STORAGE_KEY = 'depthwizard_projects';
const ACTIVE_PROJECT_KEY = 'depthwizard_active_project_id';
// Object URLs are valid only for the current tab. Keep them out of persistent
// storage, but retain them in memory so a newly uploaded image is still shown
// while the user moves straight into the workspace.
const transientImageSources = new Map();

const isTransientImageSource = (value) =>
  typeof value === 'string' && (value.startsWith('data:') || value.startsWith('blob:'));

const toPersistentProject = (project) => {
  const persistent = { ...project };
  if (isTransientImageSource(persistent.imageSrc)) delete persistent.imageSrc;
  return persistent;
};

const hydrateProject = (project) => {
  const transientImageSrc = transientImageSources.get(project.id);
  return transientImageSrc ? { ...project, imageSrc: transientImageSrc } : project;
};

const readPersistentProjects = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const projects = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(projects)) return [];

    const compactProjects = projects.map(toPersistentProject);
    if (JSON.stringify(compactProjects) !== JSON.stringify(projects)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactProjects));
    }
    return compactProjects;
  } catch (e) {
    console.error('Failed to read projects from localStorage:', e);
    return [];
  }
};

export const projectStore = {
  getProjects() {
    return readPersistentProjects().map(hydrateProject);
  },

  getProject(id) {
    const list = this.getProjects();
    return list.find((p) => p.id === id) || null;
  },

  getActiveProjectId() {
    return localStorage.getItem(ACTIVE_PROJECT_KEY) || null;
  },

  getActiveProject() {
    const id = this.getActiveProjectId();
    if (!id) {
      const list = this.getProjects();
      return list.length > 0 ? list[0] : null;
    }
    return this.getProject(id) || null;
  },

  setActiveProject(id) {
    if (id) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  },

  saveProject(project) {
    const list = this.getProjects();
    const existingIndex = list.findIndex((p) => p.id === project.id);

    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    if (isTransientImageSource(updatedProject.imageSrc)) {
      transientImageSources.set(updatedProject.id, updatedProject.imageSrc);
    }

    const persistentProject = toPersistentProject(updatedProject);
    if (existingIndex >= 0) {
      list[existingIndex] = persistentProject;
    } else {
      list.unshift(persistentProject);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map(toPersistentProject)));
      this.setActiveProject(updatedProject.id);

      // Async sync to remote MongoDB backend
      if (updatedProject.id && !updatedProject.isSample) {
        updateProjectApi(updatedProject.id, persistentProject).catch(() => {});
      }

      return updatedProject;
    } catch (e) {
      console.error('Failed to save project:', e);
      throw new Error('Storage quota exceeded or storage unavailable.');
    }
  },

  deleteProject(id) {
    let list = this.getProjects();
    list = list.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

    if (this.getActiveProjectId() === id) {
      const nextActive = list.length > 0 ? list[0].id : null;
      this.setActiveProject(nextActive);
    }

    // Sync deletion to remote backend / MongoDB
    deleteRemoteProject(id).catch(() => {});

    return list;
  },

  async syncWithRemote() {
    try {
      const remoteProjects = await fetchRemoteProjects();
      if (!Array.isArray(remoteProjects) || remoteProjects.length === 0) return this.getProjects();

      const localList = readPersistentProjects();
      const localMap = new Map(localList.map((p) => [p.id, p]));

      for (const remote of remoteProjects) {
        if (!localMap.has(remote.id)) {
          localList.push(remote);
        } else {
          // Merge metadata
          const existing = localMap.get(remote.id);
          localMap.set(remote.id, { ...existing, ...remote });
        }
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(localList));
      return this.getProjects();
    } catch (err) {
      console.warn('Sync with remote MongoDB skipped:', err.message);
      return this.getProjects();
    }
  },

  getStatistics() {
    const list = this.getProjects();
    const total = list.length;
    const calibratedCount = list.filter((p) => p.mode === 'calibrated').length;
    const relativeCount = list.filter((p) => p.mode === 'relative').length;
    const completedCount = list.filter((p) => p.status === 'completed' || p.status === 'ready').length;

    const totalMegapixels = list.reduce((acc, p) => {
      if (p.metadata?.width && p.metadata?.height && typeof p.metadata.width === 'number') {
        return acc + (p.metadata.width * p.metadata.height) / 1_000_000;
      }
      return acc;
    }, 0);

    return {
      totalAnalyses: total,
      calibratedAnalyses: calibratedCount,
      relativeAnalyses: relativeCount,
      completedAnalyses: completedCount,
      totalMegapixelsProcessed: Number(totalMegapixels.toFixed(2)),
      hasRecords: total > 0,
    };
  },

  createSampleProject() {
    const sample = {
      id: `proj_sample_${Date.now()}`,
      name: 'Sample River Valley (Demo Crop)',
      description: 'Pre-bundled river-valley satellite crop for UI testing and depth-inference demonstration.',
      isSample: true,
      mode: 'relative',
      createdAt: new Date().toISOString(),
      status: 'ready',
      stage: 'ready_for_inference',
      metadata: {
        filename: 'river_valley_demo.png',
        fileSize: 2306526,
        formattedSize: '2.20 MB',
        width: 1864,
        height: 960,
        channels: 3,
        format: 'PNG',
      },
      imageSrc: '/samples/river_valley_demo.png',
      depthMapSrc: null,
      elevationMapSrc: null,
    };
    return this.saveProject(sample);
  },
};
