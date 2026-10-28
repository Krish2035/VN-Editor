import ffmpeg from '../config/ffmpeg';
import fs from 'fs';
import path from 'path';

export interface MediaMetadata {
  durationSec: number;
  width?: number;
  height?: number;
  hasAudio: boolean;
  hasVideo: boolean;
  fps?: number;
}

export const extractMetadata = (filePath: string): Promise<MediaMetadata> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);

      const durationSec = metadata.format.duration || 0;
      let width: number | undefined;
      let height: number | undefined;
      let hasVideo = false;
      let hasAudio = false;
      let fps: number | undefined;

      metadata.streams.forEach((stream) => {
        if (stream.codec_type === 'video') {
          hasVideo = true;
          width = stream.width;
          height = stream.height;
          if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split('/').map(Number);
            if (den && den > 0) fps = Math.round(num / den);
          }
        } else if (stream.codec_type === 'audio') {
          hasAudio = true;
        }
      });

      resolve({
        durationSec,
        width,
        height,
        hasAudio,
        hasVideo,
        fps
      });
    });
  });
};

/**
 * Extracts normalized peak waveform points (0.0 to 1.0) from media file
 */
export const extractWaveform = (filePath: string, points = 120): Promise<number[]> => {
  return new Promise((resolve) => {
    // Generate synthetic or raw audio peaks using ffmpeg volume/astats or downsampled 8kHz PCM
    const tempPcmPath = `${filePath}.pcm`;
    
    ffmpeg(filePath)
      .noVideo()
      .audioChannels(1)
      .audioFrequency(4000)
      .format('s16le')
      .output(tempPcmPath)
      .on('end', () => {
        try {
          if (!fs.existsSync(tempPcmPath)) {
            return resolve(generateFallbackPeaks(points));
          }

          const buffer = fs.readFileSync(tempPcmPath);
          fs.unlinkSync(tempPcmPath); // Clean up immediately

          const samples = new Int16Array(
            buffer.buffer,
            buffer.byteOffset,
            Math.floor(buffer.length / 2)
          );

          if (samples.length === 0) {
            return resolve(generateFallbackPeaks(points));
          }

          const blockSize = Math.floor(samples.length / points);
          const peaks: number[] = [];

          for (let i = 0; i < points; i++) {
            const start = i * blockSize;
            let max = 0;
            for (let j = 0; j < blockSize; j++) {
              const val = Math.abs(samples[start + j] || 0);
              if (val > max) max = val;
            }
            // Normalize to 0.0 - 1.0
            peaks.push(Math.min(1.0, Number((max / 32768).toFixed(3))));
          }

          resolve(peaks);
        } catch {
          resolve(generateFallbackPeaks(points));
        }
      })
      .on('error', () => {
        // Fallback smooth waveform so UI doesn't break
        resolve(generateFallbackPeaks(points));
      })
      .run();
  });
};

function generateFallbackPeaks(points: number): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < points; i++) {
    const v = 0.3 + 0.6 * Math.abs(Math.sin(i * 0.25) * Math.cos(i * 0.1));
    peaks.push(Number(v.toFixed(3)));
  }
  return peaks;
}
