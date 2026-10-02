/**
 * DepthWizard Project Store
 * Local storage persistence layer for genuine project records and statistics.
 * In compliance with SIH standards: No fabricated or hardcoded statistical metrics.
 */

const STORAGE_KEY = 'depthwizard_projects';
const ACTIVE_PROJECT_KEY = 'depthwizard_active_project_id';

export const projectStore = {
  getProjects() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('Failed to read projects from localStorage:', e);
      return [];
    }
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

    if (existingIndex >= 0) {
      list[existingIndex] = updatedProject;
    } else {
      list.unshift(updatedProject);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      this.setActiveProject(updatedProject.id);
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
    return list;
  },

  getStatistics() {
    const list = this.getProjects();
    const total = list.length;
    const calibratedCount = list.filter((p) => p.mode === 'calibrated').length;
    const relativeCount = list.filter((p) => p.mode === 'relative').length;
    const completedCount = list.filter((p) => p.status === 'completed' || p.status === 'ready').length;

    // Calculate total megapixels processed from actual records
    const totalMegapixels = list.reduce((acc, p) => {
      if (p.metadata?.width && p.metadata?.height) {
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
      name: 'Sample Alpine Ridge (Himalayas Crop)',
      description: 'Pre-bundled demo optical satellite crop for UI testing and layout validation.',
      isSample: true,
      mode: 'calibrated',
      createdAt: new Date().toISOString(),
      status: 'ready',
      stage: '3d_ready',
      referenceDemName: 'Copernicus 30m DEM (Sample)',
      metadata: {
        filename: 'alpine_ridge_optical.png',
        fileSize: 458000,
        formattedSize: '447 KB',
        width: 512,
        height: 512,
        channels: 3,
        format: 'PNG',
        minElevationMeters: 3120,
        maxElevationMeters: 4890,
      },
      imageSrc: '/samples/alpine_ridge_optical.png',
      depthMapSrc: '/samples/alpine_ridge_depth.png',
      elevationMapSrc: '/samples/alpine_ridge_depth.png',
    };
    return this.saveProject(sample);
  },
};
