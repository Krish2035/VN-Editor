import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { RenderJob, VNProject } from '../types';
import { renderProjectWithFFmpeg } from './ffmpegService';
import path from 'path';
import { EXPORT_DIR } from './storageService';

// Active WebSocket client registry for telemetry (Pillar 22)
const wsClients = new Set<WebSocket>();

export const registerWebSocketClient = (ws: WebSocket) => {
  wsClients.add(ws);
  ws.on('close', () => wsClients.delete(ws));
};

export const broadcastTelemetry = (eventType: string, data: any) => {
  const payload = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

// In-Memory Resilient Queue with Concurrency Limit & DLQ (Pillars 15, 20, 44)
const jobQueue: RenderJob[] = [];
const jobsMap = new Map<string, RenderJob>();
let activeRendersCount = 0;
const MAX_CONCURRENT_RENDERS = 2; // Protect CPU/memory (Pillars 43, 44)

export const createRenderJob = (project: VNProject): RenderJob => {
  const jobId = `render_${uuidv4().substring(0, 8)}`;
  const outputFilename = `${jobId}_${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`;
  const outputPath = path.join(EXPORT_DIR, outputFilename);
  const outputUrl = `/exports/${outputFilename}`;

  const job: RenderJob = {
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

  jobsMap.set(jobId, job);
  jobQueue.push(job);
  broadcastTelemetry('JOB_CREATED', job);

  processNextJob(project);
  return job;
};

export const getJobById = (id: string): RenderJob | null => {
  return jobsMap.get(id) || null;
};

export const getAllJobs = (): RenderJob[] => {
  return Array.from(jobsMap.values());
};

const processNextJob = async (project: VNProject) => {
  if (activeRendersCount >= MAX_CONCURRENT_RENDERS || jobQueue.length === 0) {
    return;
  }

  const job = jobQueue.shift();
  if (!job) return;

  activeRendersCount++;
  job.status = 'rendering';
  job.updatedAt = new Date().toISOString();
  broadcastTelemetry('JOB_STARTED', job);

  try {
    await renderProjectWithFFmpeg(
      project,
      job.outputPath!,
      (progress, currentFrame, fps) => {
        job.progress = Math.min(100, Math.max(0, Math.round(progress)));
        job.currentFrame = currentFrame;
        job.fps = fps;
        job.updatedAt = new Date().toISOString();
        broadcastTelemetry('JOB_PROGRESS', {
          jobId: job.id,
          progress: job.progress,
          currentFrame: job.currentFrame,
          totalFrames: job.totalFrames,
          fps: job.fps
        });
      }
    );

    job.status = 'completed';
    job.progress = 100;
    job.updatedAt = new Date().toISOString();
    broadcastTelemetry('JOB_COMPLETED', job);
  } catch (err: any) {
    job.status = 'failed';
    job.error = err.message || 'Render failed in FFmpeg pipeline';
    job.updatedAt = new Date().toISOString();
    console.error(`[DLQ] Render job failed: ${job.id}`, err);
    broadcastTelemetry('JOB_FAILED', job);
  } finally {
    activeRendersCount--;
    // Drain next item in queue
    processNextJob(project);
  }
};
