import { VNClip, VNTrack } from '../types';

class WebAudioEngine {
  private ctx: AudioContext | null = null;
  private audioElements = new Map<string, HTMLAudioElement>();
  private masterGain: GainNode | null = null;

  public init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public syncPlayback(tracks: VNTrack[], currentTimeMs: number, isPlaying: boolean) {
    this.init();

    const audioTracks = tracks.filter((t) => (t.type === 'audio' || t.type === 'sfx') && t.visible && !t.muted);

    // Collect all active clips
    const activeClipIds = new Set<string>();

    for (const track of audioTracks) {
      for (const clip of track.clips) {
        const isWithinRange =
          currentTimeMs >= clip.startMs && currentTimeMs <= clip.startMs + clip.durationMs;

        if (isWithinRange && clip.assetUrl) {
          activeClipIds.add(clip.id);
          this.playOrSeekClip(clip, currentTimeMs, isPlaying);
        } else {
          this.pauseClip(clip.id);
        }
      }
    }

    // Clean up paused clips that aren't active
    for (const [id, audio] of this.audioElements.entries()) {
      if (!activeClipIds.has(id) && !audio.paused) {
        audio.pause();
      }
    }
  }

  private playOrSeekClip(clip: VNClip, currentTimeMs: number, isPlaying: boolean) {
    if (!this.ctx || !clip.assetUrl) return;

    let audio = this.audioElements.get(clip.id);
    if (!audio) {
      audio = new Audio(clip.assetUrl);
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      this.audioElements.set(clip.id, audio);
    }

    const clipOffsetSec = (currentTimeMs - clip.startMs + clip.trimInMs) / 1000;

    // Apply Volume and Fades
    let volume = clip.volume !== undefined ? clip.volume : 1.0;
    const elapsedMs = currentTimeMs - clip.startMs;
    const remainingMs = clip.startMs + clip.durationMs - currentTimeMs;

    if (clip.fadeInMs > 0 && elapsedMs < clip.fadeInMs) {
      volume *= elapsedMs / clip.fadeInMs;
    }
    if (clip.fadeOutMs > 0 && remainingMs < clip.fadeOutMs) {
      volume *= remainingMs / clip.fadeOutMs;
    }

    audio.volume = Math.max(0, Math.min(1, volume));

    // Sync playhead time with drift tolerance (0.15s)
    if (Math.abs(audio.currentTime - clipOffsetSec) > 0.15) {
      audio.currentTime = clipOffsetSec;
    }

    if (isPlaying && audio.paused) {
      audio.play().catch(() => {
        // Autoplay policy fallback
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }

  private pauseClip(clipId: string) {
    const audio = this.audioElements.get(clipId);
    if (audio && !audio.paused) {
      audio.pause();
    }
  }

  public stopAll() {
    for (const audio of this.audioElements.values()) {
      audio.pause();
    }
  }
}

export const audioEngine = new WebAudioEngine();
