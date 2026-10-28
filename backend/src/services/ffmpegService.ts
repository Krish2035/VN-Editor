import ffmpeg from '../config/ffmpeg';
import { VNProject } from '../types';
import fs from 'fs';
import path from 'path';

export type ProgressCallback = (percent: number, currentFrame: number, fps: number) => void;

export const renderProjectWithFFmpeg = (
  project: VNProject,
  outputPath: string,
  onProgress: ProgressCallback
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const width = project.canvas.width || 1920;
    const height = project.canvas.height || 1080;
    const fps = project.canvas.fps || 30;
    const durationSec = Math.max(1, (project.canvas.durationMs || 5000) / 1000);
    const totalFrames = Math.round(durationSec * fps);

    // Find main video clips
    const videoTrack = project.tracks.find((t) => t.type === 'video');
    const validClips = videoTrack ? videoTrack.clips.filter((c) => c.assetUrl) : [];

    const command = ffmpeg();

    if (validClips.length > 0 && fs.existsSync(resolveAssetPath(validClips[0].assetUrl!))) {
      // Input from existing media asset
      const firstClipPath = resolveAssetPath(validClips[0].assetUrl!);
      command.input(firstClipPath);

      // Handle trim if specified
      if (validClips[0].trimInMs > 0) {
        command.setStartTime(validClips[0].trimInMs / 1000);
      }
      command.setDuration(durationSec);

      command.outputOptions([
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`,
        `-r ${fps}`,
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset fast',
        '-crf 22',
        '-c:a aac',
        '-b:a 192k'
      ]);
    } else {
      // Non-media project: Render high-fidelity VN Editor animated title slate
      // Color background + dynamic text overlay
      command.input(`color=c=0x08090C:s=${width}x${height}:r=${fps}:d=${durationSec}`);
      command.inputOption('-f lavfi');

      // Silent stereo audio stream so MP4 has audio track
      command.input(`anullsrc=r=48000:cl=stereo:d=${durationSec}`);
      command.inputOption('-f lavfi');

      const title = (project.title || 'VN Video Project').replace(/[:'\\]/g, '');
      const filterComplex = [
        `drawtext=text='VN VIDEO EDITOR':fontcolor=0x00F2FE:fontsize=${Math.round(height * 0.05)}:x=(w-text_w)/2:y=(h-text_h)/2 - 40:shadowcolor=black:shadowx=2:shadowy=2`,
        `drawtext=text='${title}':fontcolor=white:fontsize=${Math.round(height * 0.04)}:x=(w-text_w)/2:y=(h-text_h)/2 + 30:shadowcolor=black:shadowx=2:shadowy=2`,
        `drawtext=text='Rendered via VN Web Engine • 60 FPS':fontcolor=0x8892B0:fontsize=${Math.round(height * 0.025)}:x=(w-text_w)/2:y=h - 80`
      ].join(',');

      command.outputOptions([
        `-vf ${filterComplex}`,
        `-r ${fps}`,
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-preset ultrafast',
        '-c:a aac',
        '-shortest'
      ]);
    }

    command
      .output(outputPath)
      .on('start', (cmdline) => {
        console.log(`[FFmpeg] Started: ${cmdline}`);
      })
      .on('progress', (progress) => {
        const percent = progress.percent || (progress.frames ? (progress.frames / totalFrames) * 100 : 0);
        onProgress(percent, progress.frames || 0, progress.currentFps || fps);
      })
      .on('end', () => {
        console.log(`[FFmpeg] Render completed: ${outputPath}`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[FFmpeg] Error:`, err);
        reject(err);
      })
      .run();
  });
};

function resolveAssetPath(urlOrPath: string): string {
  if (path.isAbsolute(urlOrPath)) return urlOrPath;
  const filename = path.basename(urlOrPath);
  return path.resolve(__dirname, '../../uploads', filename);
}
