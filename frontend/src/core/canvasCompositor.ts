import { VNProject, VNClip, VNKeyframe } from '../types';

export interface InterpolatedTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

// Media cache to avoid reloading textures every frame
const videoCache = new Map<string, HTMLVideoElement>();
const imageCache = new Map<string, HTMLImageElement>();

export const getOrCreateVideo = (url: string): HTMLVideoElement => {
  if (videoCache.has(url)) return videoCache.get(url)!;
  const vid = document.createElement('video');
  vid.src = url;
  vid.crossOrigin = 'anonymous';
  vid.muted = true;
  vid.playsInline = true;
  vid.preload = 'auto';
  videoCache.set(url, vid);
  return vid;
};

export const getOrCreateImage = (url: string): HTMLImageElement => {
  if (imageCache.has(url)) return imageCache.get(url)!;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  imageCache.set(url, img);
  return img;
};

/**
 * Synchronizes HTML5 video elements with the timeline playhead.
 * Ensures active clips play smoothly via .play() without 300ms stuttering seeks.
 */
export const syncVideoPlayback = (
  project: VNProject,
  currentTimeMs: number,
  isPlaying: boolean
) => {
  const activeVideoUrls = new Set<string>();
  const videoTracks = project.tracks.filter(
    (t) => (t.type === 'video' || t.type === 'pip') && t.visible && !t.muted
  );

  for (const track of videoTracks) {
    for (const clip of track.clips) {
      const isWithinRange =
        currentTimeMs >= clip.startMs && currentTimeMs <= clip.startMs + clip.durationMs;

      if (isWithinRange && clip.assetUrl) {
        activeVideoUrls.add(clip.assetUrl);
        const video = getOrCreateVideo(clip.assetUrl);
        const clipOffsetSec = (currentTimeMs - clip.startMs + clip.trimInMs) / 1000;

        if (isPlaying) {
          // Playback mode: resync only if drift exceeds 120ms to allow smooth hardware decode
          if (Math.abs(video.currentTime - clipOffsetSec) > 0.12) {
            video.currentTime = clipOffsetSec;
          }
          if (video.paused && video.readyState >= 2) {
            video.play().catch(() => {
              // Browser autoplay policy suppression
            });
          }
        } else {
          // Paused mode (scrubbing): pause playback and accurately position playhead
          if (!video.paused) {
            video.pause();
          }
          if (Math.abs(video.currentTime - clipOffsetSec) > 0.04) {
            video.currentTime = clipOffsetSec;
          }
        }
      }
    }
  }

  // Pause inactive video elements to conserve GPU / CPU decoding cycles
  for (const [url, video] of videoCache.entries()) {
    if (!activeVideoUrls.has(url) && !video.paused) {
      video.pause();
    }
  }
};

/**
 * Halts all cached video playback instances (e.g. on unmount or pause)
 */
export const pauseAllVideos = () => {
  for (const video of videoCache.values()) {
    if (!video.paused) {
      video.pause();
    }
  }
};

export const interpolateKeyframes = (clip: VNClip, currentTimeMs: number): InterpolatedTransform => {
  const base = { ...clip.transform };
  if (!clip.keyframes || clip.keyframes.length === 0) return base;

  // Keyframes sorted by time
  const kfs = [...clip.keyframes].sort((a, b) => a.timeMs - b.timeMs);

  for (let i = 0; i < kfs.length; i++) {
    const kf = kfs[i];
    if (currentTimeMs <= kf.timeMs) {
      if (i === 0) {
        return applyKeyframeValue(base, kf);
      }
      const prevKf = kfs[i - 1];
      const progress = (currentTimeMs - prevKf.timeMs) / (kf.timeMs - prevKf.timeMs);
      const eased = easeProgress(progress, kf.easing);
      return lerpTransform(
        applyKeyframeValue(base, prevKf),
        applyKeyframeValue(base, kf),
        eased
      );
    }
  }

  // After last keyframe
  return applyKeyframeValue(base, kfs[kfs.length - 1]);
};

function applyKeyframeValue(base: InterpolatedTransform, kf: VNKeyframe): InterpolatedTransform {
  const result = { ...base };
  if (kf.value.x !== undefined) result.x = kf.value.x;
  if (kf.value.y !== undefined) result.y = kf.value.y;
  if (kf.value.scale !== undefined) result.scale = kf.value.scale;
  if (kf.value.rotation !== undefined) result.rotation = kf.value.rotation;
  if (kf.value.opacity !== undefined) result.opacity = kf.value.opacity;
  return result;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpTransform(a: InterpolatedTransform, b: InterpolatedTransform, t: number): InterpolatedTransform {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    scale: lerp(a.scale, b.scale, t),
    rotation: lerp(a.rotation, b.rotation, t),
    opacity: lerp(a.opacity, b.opacity, t)
  };
}

function easeProgress(t: number, easing?: string) {
  switch (easing) {
    case 'easeIn': return t * t;
    case 'easeOut': return t * (2 - t);
    case 'easeInOut': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default: return t;
  }
}

/**
 * Main Canvas Render Frame
 */
export const renderCanvasFrame = (
  ctx: CanvasRenderingContext2D,
  project: VNProject,
  currentTimeMs: number,
  selectedClipId: string | null,
  showSafeMargins: boolean
) => {
  const { width, height } = project.canvas;
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = '#08090C';
  ctx.fillRect(0, 0, width, height);

  // Draw Tracks in reverse (bottom tracks first, text on top)
  // Track hierarchy: Video -> PIP -> Text
  const trackOrder: Array<VNProject['tracks'][0]['type']> = ['video', 'pip', 'text'];

  for (const trackType of trackOrder) {
    const track = project.tracks.find((t) => t.type === trackType);
    if (!track || !track.visible || track.muted) continue;

    for (const clip of track.clips) {
      if (currentTimeMs >= clip.startMs && currentTimeMs <= clip.startMs + clip.durationMs) {
        drawClip(ctx, clip, currentTimeMs, width, height, clip.id === selectedClipId);
      }
    }
  }

  // Draw Safe Margins if enabled (Action Safe 90%, Title Safe 80%)
  if (showSafeMargins) {
    drawSafeMargins(ctx, width, height);
  }
};

function drawClip(
  ctx: CanvasRenderingContext2D,
  clip: VNClip,
  currentTimeMs: number,
  canvasWidth: number,
  canvasHeight: number,
  isSelected: boolean
) {
  const transform = interpolateKeyframes(clip, currentTimeMs);
  ctx.save();

  // Position at canvas center + transform offsets
  const centerX = canvasWidth / 2 + transform.x;
  const centerY = canvasHeight / 2 + transform.y;

  ctx.translate(centerX, centerY);
  ctx.rotate((transform.rotation * Math.PI) / 180);
  ctx.scale(transform.scale, transform.scale);
  ctx.globalAlpha = Math.max(0, Math.min(1, transform.opacity));

  // Apply Color Filter/LUT
  let filterString = '';
  if (clip.colorAdjustments) {
    const { brightness, contrast, saturation, temperature, vignette } = clip.colorAdjustments;
    filterString = `brightness(${1 + brightness / 100}) contrast(${1 + contrast / 100}) saturate(${1 + saturation / 100})`;
    if (clip.colorAdjustments.lutId === 'teal_orange') {
      filterString += ' hue-rotate(-12deg)';
    } else if (clip.colorAdjustments.lutId === 'cyberpunk') {
      filterString += ' hue-rotate(25deg) contrast(1.2)';
    } else if (clip.colorAdjustments.lutId === 'golden_hour') {
      filterString += ' sepia(0.25)';
    } else if (clip.colorAdjustments.lutId === 'noir') {
      filterString += ' grayscale(1) contrast(1.3)';
    }
  }
  ctx.filter = filterString || 'none';

  // Render Content based on Track Type
  let clipWidth = canvasWidth;
  let clipHeight = canvasHeight;

  if (clip.textData) {
    // Text Layer Rendering
    const { text, fontSize, fontFamily, color, align } = clip.textData;
    ctx.font = `700 ${fontSize}px '${fontFamily || 'Outfit'}', sans-serif`;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';

    // Text Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = color || '#FFFFFF';
    ctx.fillText(text, 0, 0);

    const metrics = ctx.measureText(text);
    clipWidth = metrics.width + 40;
    clipHeight = fontSize * 1.5;
  } else if (clip.assetUrl) {
    // Video or Image Rendering
    const video = getOrCreateVideo(clip.assetUrl);
    const clipOffsetSec = (currentTimeMs - clip.startMs + clip.trimInMs) / 1000;

    if (Math.abs(video.currentTime - clipOffsetSec) > 0.3) {
      video.currentTime = clipOffsetSec;
    }

    if (video.readyState >= 2) {
      ctx.drawImage(video, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
    } else {
      // Elegant loading slate with gradient
      const grad = ctx.createLinearGradient(-canvasWidth / 2, -canvasHeight / 2, canvasWidth / 2, canvasHeight / 2);
      grad.addColorStop(0, '#0F1219');
      grad.addColorStop(1, '#00F2FE22');
      ctx.fillStyle = grad;
      ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);

      ctx.fillStyle = '#00F2FE';
      ctx.font = "600 24px 'Inter', sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(clip.name, 0, 0);
    }
  }

  // Draw Vignette overlay if configured
  if (clip.colorAdjustments?.vignette && clip.colorAdjustments.vignette > 0) {
    const vigIntensity = clip.colorAdjustments.vignette / 100;
    const vigGrad = ctx.createRadialGradient(0, 0, canvasWidth * 0.2, 0, 0, canvasWidth * 0.7);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, `rgba(0,0,0,${vigIntensity * 0.85})`);
    ctx.fillStyle = vigGrad;
    ctx.fillRect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
  }

  ctx.restore();

  // Draw Selection Gizmo around active clip
  if (isSelected) {
    drawGizmo(ctx, centerX, centerY, clipWidth * transform.scale, clipHeight * transform.scale, transform.rotation);
  }
}

function drawGizmo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  rotationDeg: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotationDeg * Math.PI) / 180);

  const halfW = width / 2;
  const halfH = height / 2;

  // Cyan bounding ring
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(-halfW, -halfH, width, height);

  // Corner resize handles
  ctx.setLineDash([]);
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#00F2FE';
  ctx.lineWidth = 2;

  const handleSize = 10;
  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH]
  ];

  corners.forEach(([cx, cy]) => {
    ctx.fillRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(cx - handleSize / 2, cy - handleSize / 2, handleSize, handleSize);
  });

  // Rotation Handle at top
  ctx.beginPath();
  ctx.moveTo(0, -halfH);
  ctx.lineTo(0, -halfH - 24);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, -halfH - 24, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawSafeMargins(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // Action Safe (90%)
  const asX = w * 0.05;
  const asY = h * 0.05;
  ctx.strokeRect(asX, asY, w * 0.9, h * 0.9);

  // Title Safe (80%)
  const tsX = w * 0.1;
  const tsY = h * 0.1;
  ctx.strokeRect(tsX, tsY, w * 0.8, h * 0.8);

  // Center Crosshair
  ctx.beginPath();
  ctx.moveTo(w / 2 - 15, h / 2);
  ctx.lineTo(w / 2 + 15, h / 2);
  ctx.moveTo(w / 2, h / 2 - 15);
  ctx.lineTo(w / 2, h / 2 + 15);
  ctx.stroke();

  ctx.restore();
}
