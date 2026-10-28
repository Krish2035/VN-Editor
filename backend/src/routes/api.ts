import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { UPLOAD_DIR } from '../services/storageService';
import * as projectController from '../controllers/projectController';
import * as mediaController from '../controllers/mediaController';
import * as renderController from '../controllers/renderController';
import { renderJobLimiter } from '../middleware/rateLimiter';

const router = Router();

// Configure multer temporary upload staging
const upload = multer({
  dest: path.join(UPLOAD_DIR, 'tmp'),
  limits: {
    fileSize: 1024 * 1024 * 500 // 500MB max per file
  }
});

// Health Probes (112 Pillars 56-57)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSec: process.uptime(),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
  });
});

// Project endpoints
router.get('/projects', projectController.listProjects);
router.get('/projects/:id', projectController.getProject);
router.post('/projects', projectController.createOrUpdateProject);
router.delete('/projects/:id', projectController.removeProject);

// Media endpoints
router.get('/media', mediaController.listAssets);
router.post('/media/upload', upload.single('file'), mediaController.uploadMedia);

// Render endpoints (Protected by rate limiter - Pillars 1, 88)
router.post('/renders', renderJobLimiter, renderController.startRenderJob);
router.get('/renders', renderController.listRenderJobs);
router.get('/renders/:id', renderController.getRenderJobStatus);

export default router;
