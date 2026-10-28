import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { VNProject, RenderJob } from '../types';
import { renderProjectWithFFmpeg } from './ffmpegService';
import { broadcastTelemetry, getJobById, getAllJobs } from './renderQueue';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { EXPORT_DIR } from './storageService';

const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_URL = process.env.REDIS_URL;

let redisClient: IORedis | null = null;
export let isRedisConnected = false;
let renderBullQueue: Queue | null = null;
let renderWorker: Worker | null = null;

// Initialize Redis connection
export const initRedisQueue = async () => {
  try {
    redisClient = REDIS_URL
      ? new IORedis(REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
      : new IORedis({
          host: REDIS_HOST,
          port: REDIS_PORT,
          maxRetriesPerRequest: null,
          lazyConnect: true,
          retryStrategy: (times) => {
            if (times > 3) return null; // Don't spam retries if Redis isn't running
            return Math.min(times * 1000, 3000);
          }
        });

    redisClient.on('error', (err) => {
      if (!isRedisConnected) return; // Suppress noise if not connected
      console.warn('⚠️ [BullMQ] Redis connection warning:', err.message);
    });

    await redisClient.connect();
    isRedisConnected = true;
    console.log('✅ [BullMQ] Redis distributed queue connected successfully.');

    // Initialize BullMQ Queue (Pillars 15, 20)
    renderBullQueue = new Queue('video-renders', { connection: redisClient });

    // Initialize Worker Pool (Pillars 43-44: Concurrency limit & backpressure)
    renderWorker = new Worker(
      'video-renders',
      async (job: Job) => {
        const { project, renderJobId, outputPath } = job.data;
        const totalFrames = Math.round((project.canvas.durationMs / 1000) * (project.canvas.fps || 30));

        await renderProjectWithFFmpeg(project, outputPath, (progress, currentFrame, fps) => {
          job.updateProgress(Math.round(progress));
          broadcastTelemetry('JOB_PROGRESS', {
            jobId: renderJobId,
            progress: Math.round(progress),
            currentFrame,
            totalFrames,
            fps
          });
        });

        return { outputPath, status: 'completed' };
      },
      {
        connection: redisClient,
        concurrency: 2 // Max 2 concurrent 4K renders to preserve server stability
      }
    );

    renderWorker.on('completed', (job) => {
      broadcastTelemetry('JOB_COMPLETED', {
        id: job.data.renderJobId,
        outputUrl: job.data.outputUrl,
        progress: 100
      });
    });

    renderWorker.on('failed', (job, err) => {
      console.error(`[DLQ] BullMQ render job ${job?.data.renderJobId} failed:`, err);
      broadcastTelemetry('JOB_FAILED', {
        id: job?.data.renderJobId,
        error: err.message
      });
    });
  } catch (err: any) {
    console.log('ℹ️ [BullMQ] Redis not active. Running with resilient local queue worker.');
    isRedisConnected = false;
  }
};

/**
 * Queue render job through BullMQ (distributed) or local fallback
 */
export const enqueueRenderJob = async (project: VNProject, userId: string): Promise<RenderJob> => {
  const jobId = `render_${uuidv4().substring(0, 8)}`;
  const outputFilename = `${jobId}_${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
  const outputPath = path.join(EXPORT_DIR, outputFilename);
  const outputUrl = `/exports/${outputFilename}`;

  const renderJob: RenderJob = {
    id: jobId,
    projectId: project.id,
    status: 'queued',
    progress: 0,
    currentFrame: 0,
    totalFrames: Math.round((project.canvas.durationMs / 1000) * (project.canvas.fps || 30)),
    outputPath,
    outputUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isRedisConnected && renderBullQueue) {
    await renderBullQueue.add(
      'render-export',
      { project, renderJobId: jobId, outputPath, outputUrl, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500
      }
    );
    broadcastTelemetry('JOB_CREATED', renderJob);
    return renderJob;
  }

  // Graceful local worker fallback
  const { createRenderJob } = require('./renderQueue');
  return createRenderJob(project);
};

export { getJobById, getAllJobs };
