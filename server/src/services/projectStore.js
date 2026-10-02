/** Temporary file persistence when MongoDB is unavailable (server/data/projects.json). */
import fs from 'fs';
import path from 'path';
import { config } from '../config/index.js';

const dataDir = path.resolve(config.storageDir);
const dataFile = path.join(dataDir, 'projects.json');
const readAll = () => { try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return []; } };
const writeAll = (projects) => { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(dataFile, JSON.stringify(projects, null, 2)); };
export const projectStore = {
  list: () => readAll(), get: (id) => readAll().find((project) => project.id === id) || null,
  save(project) { const projects = readAll(); const index = projects.findIndex((item) => item.id === project.id); if (index >= 0) projects[index] = project; else projects.unshift(project); writeAll(projects); return project; },
  remove(id) { const projects = readAll(); const project = projects.find((item) => item.id === id); writeAll(projects.filter((item) => item.id !== id)); return project; },
};
