import fs from 'fs';
import path from 'path';

export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
export const EXPORT_DIR = path.resolve(__dirname, '../../exports');
export const DATA_DIR = path.resolve(__dirname, '../../data');
export const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
export const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');

// Ensure necessary directories exist
export const initStorage = () => {
  [UPLOAD_DIR, EXPORT_DIR, DATA_DIR, path.join(UPLOAD_DIR, 'tmp')].forEach((dir) => {
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

  // Run periodic automated maintenance to prevent ENOSPC disk exhaustion (Pillars 41, 88)
  cleanOldExports(24);
  setInterval(() => cleanOldExports(24), 60 * 60 * 1000); // Check hourly
};

/**
 * Automatically purges export artifacts and temporary uploads older than maxAgeHours
 */
export const cleanOldExports = (maxAgeHours: number = 24) => {
  try {
    if (!fs.existsSync(EXPORT_DIR)) return;
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    const files = fs.readdirSync(EXPORT_DIR);
    for (const file of files) {
      const filePath = path.join(EXPORT_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isFile() && now - stat.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          console.log(`[Storage] Cleaned expired export artifact: ${file}`);
        }
      } catch {}
    }

    // Clean tmp uploads
    const tmpDir = path.join(UPLOAD_DIR, 'tmp');
    if (fs.existsSync(tmpDir)) {
      const tmpFiles = fs.readdirSync(tmpDir);
      for (const tFile of tmpFiles) {
        const tPath = path.join(tmpDir, tFile);
        try {
          const stat = fs.statSync(tPath);
          if (stat.isFile() && now - stat.mtimeMs > 2 * 60 * 60 * 1000) {
            fs.unlinkSync(tPath);
          }
        } catch {}
      }
    }
  } catch (err: any) {
    console.warn('[Storage] Cleanup cycle warning:', err.message);
  }
};
