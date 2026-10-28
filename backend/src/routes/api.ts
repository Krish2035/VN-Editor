import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { UPLOAD_DIR } from '../services/storageService';
import * as projectController from '../controllers/projectController';
import * as mediaController from '../controllers/mediaController';
import * as renderController from '../controllers/renderController';
import * as authController from '../controllers/authController';
import { renderJobLimiter } from '../middleware/rateLimiter';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware';
import { isDatabaseConnected } from '../config/db';
import { isRedisConnected } from '../services/bullQueueService';
import { isS3Configured } from '../services/s3Service';

const router = Router();

// Configure multer temporary upload staging
const upload = multer({
  dest: path.join(UPLOAD_DIR, 'tmp'),
  limits: {
    fileSize: 1024 * 1024 * 500 // 500MB max per file
  }
});

// Comprehensive Health & Production Readiness Probes (112 Pillars 56-57)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSec: process.uptime(),
    memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    infrastructure: {
      database: isDatabaseConnected ? 'PostgreSQL (Prisma)' : 'Local File Persistence Adapter',
      jobQueue: isRedisConnected ? 'Redis Distributed (BullMQ)' : 'Resilient In-Memory Worker',
      storage: isS3Configured ? 'Cloud Object Storage (S3 / R2)' : 'Local Disk Storage'
    }
  });
});

// Authentication Endpoints (Pillars 69-70, 112)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.getMe);

// Project endpoints (Multi-tenant with IDOR protection)
router.get('/projects', optionalAuth, projectController.listProjects);
router.get('/projects/:id', optionalAuth, projectController.getProject);
router.post('/projects', optionalAuth, projectController.createOrUpdateProject);
router.delete('/projects/:id', optionalAuth, projectController.removeProject);

// Media endpoints (S3 Presigned URLs + Local Fallback)
router.get('/media', optionalAuth, mediaController.listAssets);
router.post('/media/presign-upload', optionalAuth, mediaController.getPresignedUpload);
router.post('/media/upload', optionalAuth, upload.single('file'), mediaController.uploadMedia);

// Render endpoints (Protected by rate limiter & BullMQ Queue - Pillars 1, 15, 88)
router.post('/renders', optionalAuth, renderJobLimiter, renderController.startRenderJob);
router.get('/renders', optionalAuth, renderController.listRenderJobs);
router.get('/renders/:id', optionalAuth, renderController.getRenderJobStatus);

export default router;
