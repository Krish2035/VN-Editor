import ffmpeg from '../config/ffmpeg';
import { VNProject, VNClip } from '../types';
import fs from 'fs';
import path from 'path';

export type ProgressCallback = (percent: number, currentFrame: number, fps: number) => void;

/**
 * Resolves local file system path for uploaded media assets
 */
export function resolveAssetPath(urlOrPath: string): string {
  if (path.isAbsolute(urlOrPath)) return urlOrPath;
  const filename = path.basename(urlOrPath);
  return path.resolve(__dirname, '../../uploads', filename);
}

/**
 * Escapes text for FFmpeg drawtext filter syntax
 */
function escapeDrawText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%');
}

/**
 * Production-Grade Multi-Track FFmpeg Compositor
 * Layers video cuts, PiP overlays, kinetic subtitles, and mixed audio tracks.
 */
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

    // 1. Gather all active clips across tracks
    const videoTrack = project.tracks.find((t) => t.type === 'video' && t.visible && !t.muted);
    const pipTrack = project.tracks.find((t) => t.type === 'pip' && t.visible && !t.muted);
    const textTrack = project.tracks.find((t) => t.type === 'text' && t.visible && !t.muted);
    const audioTracks = project.tracks.filter(
      (t) => (t.type === 'audio' || t.type === 'sfx') && t.visible && !t.muted
    );

    const validVideoClips = (videoTrack?.clips || []).filter(
      (c) => c.assetUrl && fs.existsSync(resolveAssetPath(c.assetUrl))
    );
    const validPipClips = (pipTrack?.clips || []).filter(
      (c) => c.assetUrl && fs.existsSync(resolveAssetPath(c.assetUrl))
    );
    const validTextClips = (textTrack?.clips || []).filter(
      (c) => c.textData && c.textData.text.trim().length > 0
    );

    const validAudioClips: Array<{ clip: VNClip; path: string }> = [];
    for (const at of audioTracks) {
      for (const ac of at.clips) {
        if (ac.assetUrl && fs.existsSync(resolveAssetPath(ac.assetUrl))) {
          validAudioClips.push({ clip: ac, path: resolveAssetPath(ac.assetUrl) });
        }
      }
    }

    const command = ffmpeg();

    // =========================================================================
    // BRANCH A: Project has no media assets -> Render animated title slate
    // =========================================================================
    if (validVideoClips.length === 0 && validPipClips.length === 0) {
      command.input(`color=c=0x08090C:s=${width}x${height}:r=${fps}:d=${durationSec}`);
      command.inputOption('-f lavfi');

      // Silent stereo audio track
      command.input('anullsrc=channel_layout=stereo:sample_rate=48000');
      command.inputOption('-f', 'lavfi');
      command.inputOption('-t', durationSec.toString());

      const title = escapeDrawText(project.title || 'VN Video Project');
      const textFilters = [
        `drawtext=text='VN VIDEO EDITOR':fontcolor=0x00F2FE:fontsize=${Math.round(height * 0.05)}:x=(w-text_w)/2:y=(h-text_h)/2 - 40:shadowcolor=black:shadowx=2:shadowy=2`,
        `drawtext=text='${title}':fontcolor=white:fontsize=${Math.round(height * 0.04)}:x=(w-text_w)/2:y=(h-text_h)/2 + 30:shadowcolor=black:shadowx=2:shadowy=2`,
        `drawtext=text='Rendered via VN Web Engine • 60 FPS':fontcolor=0x8892B0:fontsize=${Math.round(height * 0.025)}:x=(w-text_w)/2:y=h - 80`
      ];

      // Overlay text subtitle clips if any exist
      for (const tc of validTextClips) {
        const startSec = Math.max(0, tc.startMs / 1000);
        const endSec = Math.min(durationSec, (tc.startMs + tc.durationMs) / 1000);
        const txt = escapeDrawText(tc.textData!.text);
        const size = Math.round(tc.textData!.fontSize || 42);
        const color = (tc.textData!.color || '#FFFFFF').replace('#', '0x');
        textFilters.push(
          `drawtext=text='${txt}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=h*0.75:enable='between(t,${startSec},${endSec})':shadowcolor=black:shadowx=2:shadowy=2`
        );
      }

      command.outputOptions([
        '-vf',
        textFilters.join(','),
        '-r',
        fps.toString(),
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-preset',
        'ultrafast',
        '-c:a',
        'aac',
        '-shortest',
        '-movflags',
        '+faststart'
      ]);

      executeFFmpeg(command, outputPath, totalFrames, fps, onProgress, resolve, reject);
      return;
    }

    // =========================================================================
    // BRANCH B: Multi-Track Video & Audio Composition
    // =========================================================================

    // Input 0: Master Base Canvas Background
    command.input(`color=c=0x08090C:s=${width}x${height}:r=${fps}:d=${durationSec}`);
    command.inputOption('-f lavfi');

    let currentInputIndex = 1;
    const filterComplex: string[] = [];
    let currentVideoStream = '0:v';

    // 1. Add Main Video Track Inputs & Overlays
    for (let i = 0; i < validVideoClips.length; i++) {
      const clip = validVideoClips[i];
      const clipPath = resolveAssetPath(clip.assetUrl!);
      command.input(clipPath);

      const inIdx = currentInputIndex++;
      const trimStartSec = Math.max(0, clip.trimInMs / 1000);
      const clipDurationSec = Math.max(0.1, clip.durationMs / 1000);
      const startSec = Math.max(0, clip.startMs / 1000);
      const endSec = Math.min(durationSec, startSec + clipDurationSec);

      const trimmedTag = `v_trim_${i}`;
      const overlayTag = `v_stage_${i}`;

      // Trim, reset PTS, and scale to target canvas aspect
      filterComplex.push(
        `[${inIdx}:v]trim=start=${trimStartSec}:duration=${clipDurationSec},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black[${trimmedTag}]`
      );

      // Overlay onto progressive canvas stream at designated timeline start
      filterComplex.push(
        `[${currentVideoStream}][${trimmedTag}]overlay=enable='between(t,${startSec},${endSec})'[${overlayTag}]`
      );
      currentVideoStream = overlayTag;
    }

    // 2. Add Picture-in-Picture (PiP) Overlay Inputs
    for (let p = 0; p < validPipClips.length; p++) {
      const clip = validPipClips[p];
      const clipPath = resolveAssetPath(clip.assetUrl!);
      command.input(clipPath);

      const inIdx = currentInputIndex++;
      const trimStartSec = Math.max(0, clip.trimInMs / 1000);
      const clipDurationSec = Math.max(0.1, clip.durationMs / 1000);
      const startSec = Math.max(0, clip.startMs / 1000);
      const endSec = Math.min(durationSec, startSec + clipDurationSec);

      const pipScale = clip.transform?.scale || 0.4;
      const pipW = Math.round(width * pipScale);
      const pipH = Math.round(height * pipScale);
      const pipX = Math.round(width / 2 + (clip.transform?.x || 0) - pipW / 2);
      const pipY = Math.round(height / 2 + (clip.transform?.y || 0) - pipH / 2);

      const pipTrimTag = `pip_trim_${p}`;
      const pipStageTag = `pip_stage_${p}`;

      filterComplex.push(
        `[${inIdx}:v]trim=start=${trimStartSec}:duration=${clipDurationSec},setpts=PTS-STARTPTS,scale=${pipW}:${pipH}[${pipTrimTag}]`
      );

      filterComplex.push(
        `[${currentVideoStream}][${pipTrimTag}]overlay=x=${pipX}:y=${pipY}:enable='between(t,${startSec},${endSec})'[${pipStageTag}]`
      );
      currentVideoStream = pipStageTag;
    }

    // 3. Add Subtitles / Text Overlays
    for (let t = 0; t < validTextClips.length; t++) {
      const clip = validTextClips[t];
      const startSec = Math.max(0, clip.startMs / 1000);
      const endSec = Math.min(durationSec, (clip.startMs + clip.durationMs) / 1000);
      const txt = escapeDrawText(clip.textData!.text);
      const size = Math.round(clip.textData!.fontSize || 48);
      const color = (clip.textData!.color || '#FFFFFF').replace('#', '0x');
      const txtStageTag = `txt_stage_${t}`;

      filterComplex.push(
        `[${currentVideoStream}]drawtext=text='${txt}':fontcolor=${color}:fontsize=${size}:x=(w-text_w)/2:y=h*0.8:enable='between(t,${startSec},${endSec})':shadowcolor=black:shadowx=2:shadowy=2[${txtStageTag}]`
      );
      currentVideoStream = txtStageTag;
    }

    // 4. Mix Audio Tracks (BGM & Sound Effects)
    let currentAudioStream = 'a_out';
    if (validAudioClips.length > 0) {
      const audioTags: string[] = [];

      for (let a = 0; a < validAudioClips.length; a++) {
        const { clip, path: clipPath } = validAudioClips[a];
        command.input(clipPath);

        const inIdx = currentInputIndex++;
        const trimStartSec = Math.max(0, clip.trimInMs / 1000);
        const clipDurationSec = Math.max(0.1, clip.durationMs / 1000);
        const delayMs = Math.round(clip.startMs);
        const volume = clip.volume !== undefined ? clip.volume : 1.0;
        const aTag = `a_clip_${a}`;

        filterComplex.push(
          `[${inIdx}:a]atrim=start=${trimStartSec}:duration=${clipDurationSec},asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},volume=${volume}[${aTag}]`
        );
        audioTags.push(`[${aTag}]`);
      }

      if (audioTags.length === 1) {
        filterComplex.push(`${audioTags[0]}aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[${currentAudioStream}]`);
      } else {
        filterComplex.push(
          `${audioTags.join('')}amix=inputs=${audioTags.length}:dropout_transition=0:normalize=0[${currentAudioStream}]`
        );
      }
    } else {
      // Create silent stereo audio stream
      command.input('anullsrc=channel_layout=stereo:sample_rate=48000');
      command.inputOption('-f', 'lavfi');
      command.inputOption('-t', durationSec.toString());
      const silentInIdx = currentInputIndex++;
      filterComplex.push(`[${silentInIdx}:a]atrim=duration=${durationSec}[${currentAudioStream}]`);
    }

    // Configure filter complex and output mapping
    command.complexFilter(filterComplex);
    command.outputOptions([
      '-map',
      `[${currentVideoStream}]`,
      '-map',
      `[${currentAudioStream}]`,
      '-r',
      fps.toString(),
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'fast',
      '-crf',
      '20',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-shortest',
      '-movflags',
      '+faststart'
    ]);

    executeFFmpeg(command, outputPath, totalFrames, fps, onProgress, resolve, reject);
  });
};

function executeFFmpeg(
  command: any,
  outputPath: string,
  totalFrames: number,
  fps: number,
  onProgress: ProgressCallback,
  resolve: () => void,
  reject: (err: any) => void
) {
  command
    .output(outputPath)
    .on('start', (cmdline: string) => {
      console.log(`[FFmpeg Compositor] Started: ${cmdline}`);
    })
    .on('progress', (progress: any) => {
      const current = progress.frames || 0;
      const percent = progress.percent
        ? Math.min(100, Math.round(progress.percent))
        : Math.min(100, Math.round((current / totalFrames) * 100));
      onProgress(percent, current, progress.currentFps || fps);
    })
    .on('end', () => {
      console.log(`[FFmpeg Compositor] Multi-track render completed: ${outputPath}`);
      resolve();
    })
    .on('error', (err: any) => {
      console.error(`[FFmpeg Compositor] Render error:`, err);
      reject(err);
    })
    .run();
}
