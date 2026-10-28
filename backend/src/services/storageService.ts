import fs from 'fs';
import path from 'path';

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
export const EXPORT_DIR = path.resolve(__dirname, '../../exports');
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
export const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');

// Ensure necessary directories exist
export const initStorage = () => {
  [UPLOAD_DIR, EXPORT_DIR, DATA_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify([]), 'utf-8');
  }

  if (!fs.existsSync(ASSETS_FILE)) {
    fs.writeFileSync(ASSETS_FILE, JSON.stringify([]), 'utf-8');
  }
};
