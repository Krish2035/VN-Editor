import React, { useRef, useEffect, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { renderCanvasFrame } from '../core/canvasCompositor';
import { audioEngine } from '../core/audioEngine';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';

export const PreviewMonitor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    project,
    currentTimeMs,
    isPlaying,
    setCurrentTime,
    setIsPlaying,
    togglePlay,
    selectedClipId,
    showSafeMargins,
    updateClipTransform
  } = useEditorStore();

  // Drag interaction on canvas preview for interactive repositioning
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // 60 FPS Canvas Render Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvasFrame(ctx, project, currentTimeMs, selectedClipId, showSafeMargins);
        }
      }

      // Sync Web Audio API
      audioEngine.syncPlayback(project.tracks, currentTimeMs, isPlaying);

      // Advance playhead if playing
      if (isPlaying) {
        const nextTime = currentTimeMs + 1000 / (project.canvas.fps || 60);
        if (nextTime >= project.canvas.durationMs) {
          setCurrentTime(0);
          setIsPlaying(false);
        } else {
          setCurrentTime(nextTime);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [project, currentTimeMs, isPlaying, selectedClipId, showSafeMargins, project.canvas.fps]);

  // Global Spacebar Play/Pause Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyK') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyJ') {
        e.preventDefault();
        setCurrentTime(Math.max(0, currentTimeMs - 1000));
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setCurrentTime(Math.min(project.canvas.durationMs, currentTimeMs + 1000));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTimeMs, project.canvas.durationMs, togglePlay, setCurrentTime]);

  // Format Milliseconds to Frame-Accurate Timecode (HH:MM:SS:FF)
  const formatTimecode = (ms: number, fps: number = 60) => {
    const totalSec = Math.floor(ms / 1000);
    const frames = Math.floor(((ms % 1000) / 1000) * fps);
    const sec = totalSec % 60;
    const min = Math.floor(totalSec / 60) % 60;
    const hrs = Math.floor(totalSec / 3600);

    return `${String(hrs).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  // Step 1 Frame Back/Forward
  const stepFrame = (deltaFrames: number) => {
    const frameMs = 1000 / (project.canvas.fps || 60);
    setCurrentTime(Math.max(0, Math.min(project.canvas.durationMs, currentTimeMs + deltaFrames * frameMs)));
  };

  // Canvas Mouse Down for Dragging Active Clip
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedClipId) return;
    setIsDraggingCanvas(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingCanvas || !dragStart || !selectedClipId) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Find current clip transform
    for (const track of project.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId);
      if (clip) {
        updateClipTransform(selectedClipId, {
          x: clip.transform.x + deltaX * 1.5,
          y: clip.transform.y + deltaY * 1.5
        });
        setDragStart({ x: e.clientX, y: e.clientY });
        break;
      }
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDragStart(null);
  };

  return (
    <div className="preview-monitor-container" ref={containerRef}>
      {/* Video Canvas Stage */}
      <div className="canvas-stage">
        <canvas
          ref={canvasRef}
          width={project.canvas.width}
          height={project.canvas.height}
          className="preview-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      {/* Transport Bar & Timecode Bar */}
      <div className="transport-bar">
        {/* Left: Timecode Display */}
        <div className="timecode-box">
          <span className="current-timecode timecode">
            {formatTimecode(currentTimeMs, project.canvas.fps)}
          </span>
          <span className="timecode-separator">/</span>
          <span className="total-timecode timecode">
            {formatTimecode(project.canvas.durationMs, project.canvas.fps)}
          </span>
        </div>

        {/* Center: Playback Transport Buttons */}
        <div className="transport-controls">
          <button
            onClick={() => setCurrentTime(0)}
            className="btn-icon"
            title="Jump to Start (Home)"
          >
            <SkipBack size={15} />
          </button>

          <button
            onClick={() => stepFrame(-1)}
            className="btn-icon"
            title="Step 1 Frame Backward (Left Arrow)"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={togglePlay}
            className="play-pause-btn"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause size={18} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: 2 }} />}
          </button>

          <button
            onClick={() => stepFrame(1)}
            className="btn-icon"
            title="Step 1 Frame Forward (Right Arrow)"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setCurrentTime(project.canvas.durationMs)}
            className="btn-icon"
            title="Jump to End (End)"
          >
            <SkipForward size={15} />
          </button>
        </div>

        {/* Right: Fullscreen / Fit */}
        <div className="transport-right">
          <button
            onClick={() => {
              if (containerRef.current) {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  containerRef.current.requestFullscreen();
                }
              }
            }}
            className="btn-icon"
            title="Fullscreen Preview"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .preview-monitor-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-canvas);
          position: relative;
          overflow: hidden;
          border-left: 1px solid var(--border-subtle);
          border-right: 1px solid var(--border-subtle);
        }

        .canvas-stage {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          background: radial-gradient(circle at center, #11141B 0%, #060709 100%);
          position: relative;
          overflow: hidden;
        }

        .preview-canvas {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8), 0 0 0 1px var(--border-subtle);
          border-radius: var(--radius-sm);
          background: #000;
          cursor: crosshair;
        }

        .transport-bar {
          height: 48px;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .timecode-box {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          background: var(--bg-base);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .current-timecode {
          color: var(--accent-cyan);
          font-weight: 700;
        }

        .timecode-separator {
          color: var(--text-muted);
        }

        .total-timecode {
          color: var(--text-secondary);
        }

        .transport-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .play-pause-btn {
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          background: var(--accent-cyan);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--accent-cyan-glow);
          transition: all 0.15s ease;
        }

        .play-pause-btn:hover {
          transform: scale(1.06);
          filter: brightness(1.15);
        }

        .play-pause-btn:active {
          transform: scale(0.96);
        }

        .transport-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};
