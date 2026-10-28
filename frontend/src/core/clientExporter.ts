import { VNProject } from '../types';
import { renderCanvasFrame } from './canvasCompositor';

export type ExportProgressCallback = (percent: number, frame: number, totalFrames: number) => void;

export const exportProjectLocally = async (
  project: VNProject,
  onProgress: ExportProgressCallback
): Promise<Blob> => {
  const { width, height, fps, durationMs } = project.canvas;
  const totalFrames = Math.max(1, Math.round((durationMs / 1000) * fps));
  const frameIntervalMs = 1000 / fps;

  // Offscreen rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Could not create offscreen 2D canvas context for rendering.');
  }

  // Set up MediaRecorder on canvas stream
  const stream = canvas.captureStream(fps);
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 12000000 // 12 Mbps for crystal-clear 1080p
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingFinished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };
  });

  recorder.start();

  // Render each frame sequentially
  for (let frame = 0; frame < totalFrames; frame++) {
    const frameTimeMs = frame * frameIntervalMs;

    renderCanvasFrame(ctx, project, frameTimeMs, null, false);

    onProgress(Math.round(((frame + 1) / totalFrames) * 100), frame + 1, totalFrames);

    // Yield to the event loop so UI doesn't freeze
    await new Promise((r) => setTimeout(r, 10));
  }

  recorder.stop();
  return await recordingFinished;
};
