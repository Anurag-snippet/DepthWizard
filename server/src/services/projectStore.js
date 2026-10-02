import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';
import { isMongoConnected } from '../config/db.js';
import { Project } from '../models/Project.js';

const dataDir = path.resolve(config.storageDir);
const dataFile = path.join(dataDir, 'projects.json');

const readLocalFile = () => {
  try {
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  } catch {
    return [];
  }
};

const writeLocalFile = (projects) => {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(projects, null, 2));
  } catch (err) {
    console.error('[DepthWizard] Failed to write local fallback projects file:', err.message);
  }
};

export const projectStore = {
  async list() {
    if (isMongoConnected()) {
      try {
        const docs = await Project.find({}).sort({ createdAt: -1 }).lean();
        return docs;
      } catch (err) {
        console.warn('[DepthWizard DB] MongoDB list failed, falling back to local file:', err.message);
      }
    }
    return readLocalFile();
  },

  async get(id) {
    if (isMongoConnected()) {
      try {
        const doc = await Project.findOne({ id }).lean();
        if (doc) return doc;
      } catch (err) {
        console.warn(`[DepthWizard DB] MongoDB get(${id}) failed, falling back to local file:`, err.message);
      }
    }
    return readLocalFile().find((p) => p.id === id) || null;
  },

  async save(projectData) {
    const updated = {
      ...projectData,
      updatedAt: new Date().toISOString(),
    };

    // Keep local file in sync as resilient backup
    try {
      const localProjects = readLocalFile();
      const index = localProjects.findIndex((item) => item.id === updated.id);
      if (index >= 0) {
        localProjects[index] = updated;
      } else {
        localProjects.unshift(updated);
      }
      writeLocalFile(localProjects);
    } catch (_) {}

    if (isMongoConnected()) {
      try {
        const doc = await Project.findOneAndUpdate(
          { id: updated.id },
          { $set: updated },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        ).lean();
        return doc;
      } catch (err) {
        console.warn('[DepthWizard DB] MongoDB save failed, persisted to local file:', err.message);
      }
    }

    return updated;
  },

  async remove(id) {
    let removedDoc = null;
    if (isMongoConnected()) {
      try {
        removedDoc = await Project.findOneAndDelete({ id }).lean();
      } catch (err) {
        console.warn(`[DepthWizard DB] MongoDB remove(${id}) failed:`, err.message);
      }
    }

    const localProjects = readLocalFile();
    const existing = localProjects.find((item) => item.id === id);
    writeLocalFile(localProjects.filter((item) => item.id !== id));

    return removedDoc || existing || null;
  },
};
