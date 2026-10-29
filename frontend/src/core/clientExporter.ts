import { VNProject } from '../types';
import { renderCanvasFrame } from './canvasCompositor';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export type ExportProgressCallback = (percent: number, frame: number, totalFrames: number) => void;

/**
 * Creates an audio stream destination that mixes all active audio/sfx tracks for export
 */
async function createMixedAudioStream(project: VNProject): Promise<{ stream: MediaStream; cleanup: () => void }> {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const dest = audioCtx.createMediaStreamDestination();

  const audioTracks = project.tracks.filter(
    (t) => (t.type === 'audio' || t.type === 'sfx') && t.visible && !t.muted
  );

  const audioElements: HTMLAudioElement[] = [];

  for (const track of audioTracks) {
    for (const clip of track.clips) {
      if (clip.assetUrl) {
        try {
          const audio = new Audio(clip.assetUrl);
          audio.crossOrigin = 'anonymous';
          const source = audioCtx.createMediaElementSource(audio);
          const gain = audioCtx.createGain();
          gain.gain.value = clip.volume !== undefined ? clip.volume : 1.0;
          source.connect(gain);
          gain.connect(dest);
          audioElements.push(audio);
        } catch {
          // Fallback if media element source restriction applies
        }
      }
    }
  }

  // Ensure stream has a valid audio track even if project has no audio clips
  if (dest.stream.getAudioTracks().length === 0) {
    const osc = audioCtx.createOscillator();
    const silentGain = audioCtx.createGain();
    silentGain.gain.value = 0.0;
    osc.connect(silentGain);
    silentGain.connect(dest);
    osc.start();
  }

  const cleanup = () => {
    audioElements.forEach((a) => a.pause());
    audioCtx.close().catch(() => {});
  };

  return { stream: dest.stream, cleanup };
}

/**
 * Export project client-side using WebCodecs (MP4) with high-res Audio-Mixed MediaRecorder Fallback
 */
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

  // ========================================================
  // TIER 1: Deterministic WebCodecs + MP4Muxer (Hardware MP4)
  // ========================================================
  if (typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined') {
    try {
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: {
          codec: 'avc',
          width,
          height,
          frameRate: fps
        },
        fastStart: 'in-memory'
      });

      let encoderError: any = null;
      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => {
          encoderError = e;
          console.warn('[WebCodecs] Encoding error:', e);
        }
      });

      encoder.configure({
        codec: 'avc1.42001f', // H.264 Baseline Profile
        width,
        height,
        bitrate: Math.min(16_000_000, Math.round(width * height * fps * 0.15)),
        framerate: fps
      });

      for (let frame = 0; frame < totalFrames; frame++) {
        if (encoderError) throw encoderError;

        const frameTimeMs = frame * frameIntervalMs;
        renderCanvasFrame(ctx, project, frameTimeMs, null, false);

        const timestampUs = Math.round(frameTimeMs * 1000);
        const videoFrame = new VideoFrame(canvas, { timestamp: timestampUs });
        encoder.encode(videoFrame, { keyFrame: frame % (fps * 2) === 0 });
        videoFrame.close();

        onProgress(Math.round(((frame + 1) / totalFrames) * 100), frame + 1, totalFrames);

        // Keep UI thread responsive
        if (frame % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      await encoder.flush();
      muxer.finalize();
      return new Blob([target.buffer], { type: 'video/mp4' });
    } catch (webcodecsErr) {
      console.warn('[WebCodecs] Falling back to Audio-Mixed MediaRecorder:', webcodecsErr);
    }
  }

  // ========================================================
  // TIER 2: Audio-Mixed MediaRecorder Fallback
  // ========================================================
  const { stream: audioStream, cleanup: audioCleanup } = await createMixedAudioStream(project);

  const canvasStream = canvas.captureStream(fps);
  const combinedStream = new MediaStream();

  // Attach canvas video track
  canvasStream.getVideoTracks().forEach((vt) => combinedStream.addTrack(vt));

  // Attach mixed audio track
  audioStream.getAudioTracks().forEach((at) => combinedStream.addTrack(at));

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
    ? 'video/webm;codecs=vp8,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(combinedStream, {
    mimeType,
    videoBitsPerSecond: 12000000,
    audioBitsPerSecond: 192000
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingFinished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      audioCleanup();
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
    await new Promise((r) => setTimeout(r, 10));
  }

  recorder.stop();
  return await recordingFinished;
};
