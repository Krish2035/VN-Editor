import { create } from 'zustand';
import { VNProject, VNTrack, VNClip, AspectRatio, ColorAdjustments, VNKeyframe } from '../types';

interface HistoryState {
  past: VNProject[];
  future: VNProject[];
}

export interface EditorStore {
  // Project State
  project: VNProject;
  history: HistoryState;

  // Playhead & Playback
  currentTimeMs: number;
  isPlaying: boolean;
  pxPerMs: number; // Timeline zoom factor (e.g. 0.05 to 0.5)
  snapToGrid: boolean;
  rippleEdit: boolean;
  magnetic: boolean;

  // Selection
  selectedClipId: string | null;
  selectedTrackId: string | null;

  // UI Panels
  activeTab: 'media' | 'audio' | 'text' | 'stickers' | 'luts' | 'speed';
  showExportModal: boolean;
  showSafeMargins: boolean;
  showShortcutsModal: boolean;
  activeSnapGuidePx: number | null;

  // Actions
  setProjectTitle: (title: string) => void;
  setAspectRatio: (aspect: AspectRatio) => void;
  setCurrentTime: (timeMs: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setZoom: (pxPerMs: number) => void;
  toggleSnap: () => void;
  toggleRipple: () => void;
  toggleMagnetic: () => void;
  toggleSafeMargins: () => void;
  toggleShortcutsModal: () => void;
  setActiveSnapGuidePx: (px: number | null) => void;
  fitClipToCanvas: (clipId: string, mode: 'fit' | 'fill' | 'reset') => void;
  setActiveTab: (tab: EditorStore['activeTab']) => void;
  setShowExportModal: (show: boolean) => void;

  selectClip: (clipId: string | null, trackId?: string) => void;
  addClipToTrack: (trackType: VNTrack['type'], clipData: Partial<VNClip>) => void;
  removeClip: (clipId: string) => void;
  splitClipAtPlayhead: () => void;
  updateClipTransform: (clipId: string, transform: Partial<VNClip['transform']>) => void;
  updateClipColor: (clipId: string, color: Partial<ColorAdjustments>) => void;
  updateClipSpeedCurve: (clipId: string, curve: Array<[number, number]>) => void;
  addKeyframeToClip: (clipId: string, property: VNKeyframe['property'], value: any) => void;
  removeKeyframeFromClip: (clipId: string, keyframeId: string) => void;
  trimClip: (clipId: string, newStartMs: number, newDurationMs: number, trimInDeltaMs: number) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartMs: number) => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '21:9': { width: 2560, height: 1080 }
};

const createInitialProject = (): VNProject => ({
  id: 'vn_proj_master',
  title: 'Cinematic Reel 01',
  version: 1,
  canvas: {
    width: 1920,
    height: 1080,
    fps: 60,
    aspectRatio: '16:9',
    durationMs: 30000
  },
  settings: {
    snapToGrid: true,
    rippleEdit: true,
    magnetic: true
  },
  tracks: [
    {
      id: 'track_text_1',
      type: 'text',
      name: 'Subtitles / Text',
      muted: false,
      locked: false,
      visible: true,
      clips: [
        {
          id: 'clip_txt_demo',
          trackId: 'track_text_1',
          name: 'Cyber Title',
          startMs: 1500,
          durationMs: 5000,
          sourceDurationMs: 5000,
          trimInMs: 0,
          trimOutMs: 5000,
          speed: 1,
          volume: 1,
          fadeInMs: 400,
          fadeOutMs: 400,
          transform: { x: 0, y: -180, scale: 1, rotation: 0, opacity: 1 },
          keyframes: [
            { id: 'kf1', timeMs: 1500, property: 'opacity', value: { opacity: 0 } },
            { id: 'kf2', timeMs: 2000, property: 'opacity', value: { opacity: 1 } }
          ],
          colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, vignette: 0 },
          textData: {
            text: 'NEON PROTOCOL',
            fontSize: 54,
            fontFamily: 'Outfit',
            color: '#00F2FE',
            align: 'center',
            animation: 'fade'
          }
        }
      ]
    },
    {
      id: 'track_pip_1',
      type: 'pip',
      name: 'PIP / Overlay',
      muted: false,
      locked: false,
      visible: true,
      clips: []
    },
    {
      id: 'track_video_1',
      type: 'video',
      name: 'Main Video Track',
      muted: false,
      locked: false,
      visible: true,
      clips: [
        {
          id: 'clip_vid_1',
          trackId: 'track_video_1',
          name: 'Cyberpunk Neon City',
          assetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          startMs: 0,
          durationMs: 8000,
          sourceDurationMs: 15000,
          trimInMs: 0,
          trimOutMs: 8000,
          speed: 1,
          speedCurve: [
            [0, 1.0],
            [0.25, 2.5],
            [0.5, 0.4],
            [0.75, 2.5],
            [1.0, 1.0]
          ],
          volume: 1,
          fadeInMs: 500,
          fadeOutMs: 500,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          keyframes: [
            { id: 'kf_vid_1', timeMs: 0, property: 'scale', value: { scale: 1 } },
            { id: 'kf_vid_2', timeMs: 8000, property: 'scale', value: { scale: 1.15 } }
          ],
          colorAdjustments: {
            brightness: 5,
            contrast: 15,
            saturation: 20,
            temperature: -5,
            vignette: 15,
            lutId: 'teal_orange'
          }
        },
        {
          id: 'clip_vid_2',
          trackId: 'track_video_1',
          name: 'Alpine Mountain Peak',
          assetUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          startMs: 8000,
          durationMs: 10000,
          sourceDurationMs: 15000,
          trimInMs: 1000,
          trimOutMs: 11000,
          speed: 1,
          volume: 1,
          fadeInMs: 300,
          fadeOutMs: 500,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          keyframes: [],
          colorAdjustments: {
            brightness: 0,
            contrast: 10,
            saturation: 15,
            temperature: 5,
            vignette: 10,
            lutId: 'golden_hour'
          }
        }
      ]
    },
    {
      id: 'track_audio_1',
      type: 'audio',
      name: 'Music & BGM',
      muted: false,
      locked: false,
      visible: true,
      clips: [
        {
          id: 'clip_aud_1',
          trackId: 'track_audio_1',
          name: 'Neon Nights (Synthwave Beat)',
          assetUrl: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg',
          startMs: 0,
          durationMs: 18000,
          sourceDurationMs: 24000,
          trimInMs: 0,
          trimOutMs: 18000,
          speed: 1,
          volume: 0.85,
          fadeInMs: 800,
          fadeOutMs: 1500,
          beats: [1200, 2400, 3600, 4800, 6000, 7200, 8400, 9600, 10800, 12000, 13200, 14400, 15600, 16800, 18000],
          waveformData: [
            0.2, 0.4, 0.7, 0.9, 0.5, 0.3, 0.6, 0.85, 0.4, 0.2, 0.7, 0.95, 0.6, 0.3, 0.8, 0.9,
            0.3, 0.5, 0.75, 0.9, 0.4, 0.2, 0.65, 0.85, 0.35, 0.2, 0.75, 1.0, 0.55, 0.3, 0.85, 0.95
          ],
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          keyframes: [],
          colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, vignette: 0 }
        }
      ]
    },
    {
      id: 'track_sfx_1',
      type: 'sfx',
      name: 'Sound FX',
      muted: false,
      locked: false,
      visible: true,
      clips: [
        {
          id: 'clip_sfx_1',
          trackId: 'track_sfx_1',
          name: 'Fast Cinematic Whoosh',
          assetUrl: 'https://actions.google.com/sounds/v1/weapons/air_whoosh.ogg',
          startMs: 7600,
          durationMs: 1500,
          sourceDurationMs: 1500,
          trimInMs: 0,
          trimOutMs: 1500,
          speed: 1,
          volume: 1,
          fadeInMs: 100,
          fadeOutMs: 100,
          transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
          keyframes: [],
          colorAdjustments: { brightness: 0, contrast: 0, saturation: 0, temperature: 0, vignette: 0 }
        }
      ]
    }
  ]
});

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: createInitialProject(),
  history: { past: [], future: [] },

  currentTimeMs: 0,
  isPlaying: false,
  pxPerMs: 0.08, // Default comfortable timeline zoom
  snapToGrid: true,
  rippleEdit: true,
  magnetic: true,

  selectedClipId: 'clip_vid_1',
  selectedTrackId: 'track_video_1',

  activeTab: 'media',
  showExportModal: false,
  showSafeMargins: false,
  showShortcutsModal: false,
  activeSnapGuidePx: null,

  setProjectTitle: (title: string) => {
    saveToHistory(set, get);
    set((state) => ({
      project: { ...state.project, title }
    }));
  },

  setAspectRatio: (aspect: AspectRatio) => {
    saveToHistory(set, get);
    const { width, height } = ASPECT_DIMENSIONS[aspect];
    set((state) => ({
      project: {
        ...state.project,
        canvas: { ...state.project.canvas, aspectRatio: aspect, width, height }
      }
    }));
  },

  setCurrentTime: (timeMs: number) => {
    const clamped = Math.max(0, Math.min(get().project.canvas.durationMs, timeMs));
    set({ currentTimeMs: clamped });
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  setZoom: (pxPerMs: number) => {
    const clamped = Math.max(0.015, Math.min(0.4, pxPerMs));
    set({ pxPerMs: clamped });
  },

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),
  toggleRipple: () => set((state) => ({ rippleEdit: !state.rippleEdit })),
  toggleMagnetic: () => set((state) => ({ magnetic: !state.magnetic })),
  toggleSafeMargins: () => set((state) => ({ showSafeMargins: !state.showSafeMargins })),
  toggleShortcutsModal: () => set((state) => ({ showShortcutsModal: !state.showShortcutsModal })),
  setActiveSnapGuidePx: (px) => set({ activeSnapGuidePx: px }),

  fitClipToCanvas: (clipId, mode) => {
    saveToHistory(set, get);
    const { project } = get();
    const isPortrait = project.canvas.aspectRatio === '9:16' || project.canvas.aspectRatio === '4:5';

    let targetScale = 1.0;
    if (mode === 'fill') {
      targetScale = isPortrait ? 1.78 : 1.35;
    } else if (mode === 'fit') {
      targetScale = isPortrait ? 0.6 : 1.0;
    } else if (mode === 'reset') {
      targetScale = 1.0;
    }

    set((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === clipId
              ? {
                  ...c,
                  transform: {
                    x: 0,
                    y: 0,
                    scale: targetScale,
                    rotation: 0,
                    opacity: 1
                  }
                }
              : c
          )
        }))
      }
    }));
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowExportModal: (show) => set({ showExportModal: show }),

  selectClip: (clipId, trackId) => set({ selectedClipId: clipId, selectedTrackId: trackId || null }),

  addClipToTrack: (trackType, clipData) => {
    saveToHistory(set, get);
    const { project, currentTimeMs } = get();
    const track = project.tracks.find((t) => t.type === trackType);
    if (!track) return;

    const newClipId = `clip_${Date.now()}`;
    const duration = clipData.durationMs || 5000;

    const newClip: VNClip = {
      id: newClipId,
      trackId: track.id,
      name: clipData.name || 'New Clip',
      assetUrl: clipData.assetUrl,
      startMs: currentTimeMs,
      durationMs: duration,
      sourceDurationMs: clipData.sourceDurationMs || duration,
      trimInMs: clipData.trimInMs || 0,
      trimOutMs: clipData.trimOutMs || duration,
      speed: clipData.speed || 1,
      speedCurve: clipData.speedCurve,
      volume: clipData.volume ?? 1,
      fadeInMs: 300,
      fadeOutMs: 300,
      waveformData: clipData.waveformData,
      beats: clipData.beats,
      transform: clipData.transform || { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
      keyframes: clipData.keyframes || [],
      colorAdjustments: clipData.colorAdjustments || {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        vignette: 0
      },
      textData: clipData.textData
    };

    const updatedTracks = project.tracks.map((t) =>
      t.id === track.id ? { ...t, clips: [...t.clips, newClip] } : t
    );

    // Auto-expand project duration if clip exceeds current boundary
    const newEnd = currentTimeMs + duration;
    const newDurationMs = Math.max(project.canvas.durationMs, newEnd + 2000);

    set({
      project: {
        ...project,
        canvas: { ...project.canvas, durationMs: newDurationMs },
        tracks: updatedTracks
      },
      selectedClipId: newClipId,
      selectedTrackId: track.id
    });
  },

  removeClip: (clipId) => {
    saveToHistory(set, get);
    const { project, rippleEdit } = get();

    let removedStartMs = 0;
    let removedDurationMs = 0;
    let targetTrackId = '';

    const updatedTracks = project.tracks.map((track) => {
      const clipToRemove = track.clips.find((c) => c.id === clipId);
      if (!clipToRemove) return track;

      removedStartMs = clipToRemove.startMs;
      removedDurationMs = clipToRemove.durationMs;
      targetTrackId = track.id;

      const remainingClips = track.clips.filter((c) => c.id !== clipId);

      // Ripple edit: Shift subsequent clips to the left to close gap (Signature VN feature)
      if (rippleEdit) {
        return {
          ...track,
          clips: remainingClips.map((c) => {
            if (c.startMs > removedStartMs) {
              return { ...c, startMs: Math.max(0, c.startMs - removedDurationMs) };
            }
            return c;
          })
        };
      }

      return { ...track, clips: remainingClips };
    });

    set({
      project: { ...project, tracks: updatedTracks },
      selectedClipId: null
    });
  },

  splitClipAtPlayhead: () => {
    saveToHistory(set, get);
    const { project, currentTimeMs, selectedClipId } = get();

    let targetClip: VNClip | undefined;
    let targetTrack: VNTrack | undefined;

    // Find the clip to split: either the explicitly selected clip or any clip currently under playhead
    for (const track of project.tracks) {
      const match = track.clips.find((c) => {
        if (selectedClipId) return c.id === selectedClipId && currentTimeMs > c.startMs && currentTimeMs < c.startMs + c.durationMs;
        return currentTimeMs > c.startMs && currentTimeMs < c.startMs + c.durationMs;
      });
      if (match) {
        targetClip = match;
        targetTrack = track;
        break;
      }
    }

    if (!targetClip || !targetTrack) return;

    const splitOffsetMs = currentTimeMs - targetClip.startMs;
    const firstDuration = splitOffsetMs;
    const secondDuration = targetClip.durationMs - splitOffsetMs;

    // First half clip
    const firstHalf: VNClip = {
      ...targetClip,
      durationMs: firstDuration,
      trimOutMs: targetClip.trimInMs + firstDuration * targetClip.speed
    };

    // Second half clip
    const secondHalf: VNClip = {
      ...targetClip,
      id: `clip_split_${Date.now()}`,
      startMs: currentTimeMs,
      durationMs: secondDuration,
      trimInMs: firstHalf.trimOutMs,
      trimOutMs: targetClip.trimOutMs
    };

    const updatedTracks = project.tracks.map((t) => {
      if (t.id !== targetTrack!.id) return t;
      const index = t.clips.findIndex((c) => c.id === targetClip!.id);
      const newClips = [...t.clips];
      newClips.splice(index, 1, firstHalf, secondHalf);
      return { ...t, clips: newClips };
    });

    set({
      project: { ...project, tracks: updatedTracks },
      selectedClipId: secondHalf.id
    });
  },

  updateClipTransform: (clipId, transformUpdates) => {
    set((state) => {
      const updatedTracks = state.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId ? { ...clip, transform: { ...clip.transform, ...transformUpdates } } : clip
        )
      }));
      return { project: { ...state.project, tracks: updatedTracks } };
    });
  },

  updateClipColor: (clipId, colorUpdates) => {
    set((state) => {
      const updatedTracks = state.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId
            ? { ...clip, colorAdjustments: { ...clip.colorAdjustments, ...colorUpdates } }
            : clip
        )
      }));
      return { project: { ...state.project, tracks: updatedTracks } };
    });
  },

  updateClipSpeedCurve: (clipId, curve) => {
    saveToHistory(set, get);
    set((state) => {
      const updatedTracks = state.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId ? { ...clip, speedCurve: curve } : clip
        )
      }));
      return { project: { ...state.project, tracks: updatedTracks } };
    });
  },

  addKeyframeToClip: (clipId, property, value) => {
    saveToHistory(set, get);
    const { currentTimeMs } = get();
    set((state) => {
      const updatedTracks = state.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          const newKf: VNKeyframe = {
            id: `kf_${Date.now()}`,
            timeMs: currentTimeMs,
            property,
            value,
            easing: 'bezier'
          };
          return {
            ...clip,
            keyframes: [...clip.keyframes.filter((k) => Math.abs(k.timeMs - currentTimeMs) > 50), newKf]
          };
        })
      }));
      return { project: { ...state.project, tracks: updatedTracks } };
    });
  },

  removeKeyframeFromClip: (clipId, keyframeId) => {
    saveToHistory(set, get);
    set((state) => {
      const updatedTracks = state.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) =>
          clip.id === clipId
            ? { ...clip, keyframes: clip.keyframes.filter((k) => k.id !== keyframeId) }
            : clip
        )
      }));
      return { project: { ...state.project, tracks: updatedTracks } };
    });
  },

  trimClip: (clipId, newStartMs, newDurationMs, trimInDeltaMs) => {
    set((state) => {
      const updatedTracks = state.project.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((clip) => {
          if (clip.id !== clipId) return clip;
          return {
            ...clip,
            startMs: Math.max(0, newStartMs),
            durationMs: Math.max(200, newDurationMs),
            trimInMs: Math.max(0, clip.trimInMs + trimInDeltaMs)
          };
        })
      }));
      return { project: { ...state.project, tracks: updatedTracks } };
    });
  },

  moveClip: (clipId, targetTrackId, newStartMs) => {
    set((state) => {
      let foundClip: VNClip | null = null;
      // Remove from old
      const cleanedTracks = state.project.tracks.map((track) => {
        const c = track.clips.find((item) => item.id === clipId);
        if (c) foundClip = c;
        return { ...track, clips: track.clips.filter((item) => item.id !== clipId) };
      });

      if (!foundClip) return state;

      const baseClip = foundClip as VNClip;
      const movedClip: VNClip = {
        ...baseClip,
        trackId: targetTrackId,
        startMs: Math.max(0, newStartMs)
      };

      const finalTracks = cleanedTracks.map((track) =>
        track.id === targetTrackId ? { ...track, clips: [...track.clips, movedClip] } : track
      );

      return { project: { ...state.project, tracks: finalTracks } };
    });
  },

  undo: () => {
    const { history, project } = get();
    if (history.past.length === 0) return;

    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);

    set({
      project: previous,
      history: {
        past: newPast,
        future: [project, ...history.future]
      }
    });
  },

  redo: () => {
    const { history, project } = get();
    if (history.future.length === 0) return;

    const next = history.future[0];
    const newFuture = history.future.slice(1);

    set({
      project: next,
      history: {
        past: [...history.past, project],
        future: newFuture
      }
    });
  }
}));

// Helper to push snapshot onto undo stack
function saveToHistory(
  set: (fn: (state: EditorStore) => Partial<EditorStore>) => void,
  get: () => EditorStore
) {
  const current = get().project;
  set((state) => ({
    history: {
      past: [...state.history.past.slice(-25), JSON.parse(JSON.stringify(current))],
      future: []
    }
  }));
}
