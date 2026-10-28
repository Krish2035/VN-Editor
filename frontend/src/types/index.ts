export type TrackType = 'text' | 'pip' | 'video' | 'audio' | 'sfx';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5' | '21:9';

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
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bezier';
}

export interface ColorAdjustments {
  brightness: number; // -100 to 100, default 0
  contrast: number;   // -100 to 100, default 0
  saturation: number; // -100 to 100, default 0
  temperature: number;// -100 to 100, default 0
  vignette: number;   // 0 to 100, default 0
  lutId?: string;
}

export interface VNClip {
  id: string;
  trackId: string;
  name: string;
  assetUrl?: string;
  mimeType?: string;
  startMs: number;       // Start position on the timeline
  durationMs: number;    // Length of clip on timeline
  sourceDurationMs: number; // Native file length
  trimInMs: number;      // Trimmed source in-point
  trimOutMs: number;     // Trimmed source out-point
  speed: number;         // Overall speed multiplier (e.g. 1.0)
  speedCurve?: Array<[number, number]>; // 5-point normalized Bezier [time, speed]
  volume: number;        // 0.0 to 2.0
  fadeInMs: number;
  fadeOutMs: number;
  waveformData?: number[]; // Audio peak array (0.0 to 1.0)
  beats?: number[];        // Beat detection timestamps in ms
  transform: {
    x: number;           // Delta X in preview canvas
    y: number;           // Delta Y in preview canvas
    scale: number;       // Default 1.0
    rotation: number;    // Degrees (0 - 360)
    opacity: number;     // 0.0 to 1.0
  };
  keyframes: VNKeyframe[];
  colorAdjustments: ColorAdjustments;
  textData?: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    align: 'left' | 'center' | 'right';
    animation?: 'fade' | 'pop' | 'typewriter' | 'slideUp';
  };
}

export interface VNTrack {
  id: string;
  type: TrackType;
  name: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  clips: VNClip[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface InfrastructureStatus {
  database: string;
  jobQueue: string;
  storage: string;
}

export interface VNProject {
  id: string;
  userId?: string;
  title: string;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  canvas: {
    width: number;
    height: number;
    fps: number;
    aspectRatio: AspectRatio;
    durationMs: number;
  };
  tracks: VNTrack[];
  settings: {
    snapToGrid: boolean;
    rippleEdit: boolean;
    magnetic: boolean;
  };
}

export interface MediaAssetPreset {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'sfx' | 'image' | 'lut';
  thumbnailUrl?: string;
  url: string;
  durationSec: number;
  category: string;
  beats?: number[];
  waveformData?: number[];
}

