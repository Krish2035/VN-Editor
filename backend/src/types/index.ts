export type TrackType = 'text' | 'pip' | 'video' | 'audio' | 'sfx';

export interface VNKeyframe {
  id: string;
  timeMs: number;
  property: 'position' | 'scale' | 'rotation' | 'opacity';
  value: {
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    opacity?: number;
  };
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bezier';
}

export interface VNClip {
  id: string;
  assetId?: string;
  assetUrl?: string;
  name: string;
  startMs: number;
  durationMs: number;
  trimInMs: number;
  trimOutMs: number;
  speed: number;
  speedCurve?: Array<[number, number]>;
  volume: number;
  fadeInMs: number;
  fadeOutMs: number;
  transform: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    opacity: number;
  };
  keyframes: VNKeyframe[];
  colorAdjustments?: {
    brightness: number;
    contrast: number;
    saturation: number;
    temperature: number;
    vignette: number;
    lutUrl?: string;
  };
  textData?: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    align: 'left' | 'center' | 'right';
  };
  transition?: {
    type: 'dissolve' | 'fadeBlack' | 'slideLeft' | 'zoomIn';
    durationMs: number;
  };
}

export interface VNTrack {
  id: string;
  type: TrackType;
  name: string;
  visible?: boolean;
  muted: boolean;
  locked: boolean;
  clips: VNClip[];
}

export interface VNProject {
  id: string;
  userId: string;
  title: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  canvas: {
    width: number;
    height: number;
    fps: number;
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5' | '21:9';
    durationMs: number;
  };
  tracks: VNTrack[];
  settings: {
    snapToGrid: boolean;
    rippleEdit: boolean;
    magnetic: boolean;
  };
}

export interface RenderJob {
  id: string;
  projectId: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  currentFrame?: number;
  totalFrames?: number;
  fps?: number;
  estimatedRemainingSec?: number;
  outputUrl?: string;
  outputPath?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAsset {
  id: string;
  userId?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  durationSec?: number;
  width?: number;
  height?: number;
  url: string;
  waveformData?: number[];
  createdAt: string;
}
