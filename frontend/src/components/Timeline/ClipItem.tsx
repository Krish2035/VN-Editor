import React from 'react';
import { VNClip, TrackType } from '../../types';
import { useEditorStore } from '../../store/editorStore';
import { Diamond, Zap } from 'lucide-react';

interface ClipItemProps {
  clip: VNClip;
  trackType: TrackType;
}

export const ClipItem: React.FC<ClipItemProps> = ({ clip, trackType }) => {
    const {
    pxPerMs,
    selectedClipId,
    selectClip,
    trimClip,
    moveClip,
    project,
    magnetic,
    setActiveSnapGuidePx
  } = useEditorStore();

  const isSelected = selectedClipId === clip.id;
  const leftPx = clip.startMs * pxPerMs;
  const widthPx = Math.max(20, clip.durationMs * pxPerMs);

  // Left Trim Handle Drag
  const handleLeftTrim = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialStart = clip.startMs;
    const initialDuration = clip.durationMs;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaMs = deltaPx / pxPerMs;
      const newStart = initialStart + deltaMs;
      const newDuration = initialDuration - deltaMs;

      if (newDuration > 300 && newStart >= 0) {
        trimClip(clip.id, newStart, newDuration, deltaMs);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Right Trim Handle Drag
  const handleRightTrim = (e: React.MouseEvent) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = clip.durationMs;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      const deltaMs = deltaPx / pxPerMs;
      const newDuration = initialDuration + deltaMs;

      if (newDuration > 300) {
        trimClip(clip.id, clip.startMs, newDuration, 0);
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Clip Body Drag to Move
  const handleClipDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectClip(clip.id, clip.trackId);

    const startX = e.clientX;
    const initialStart = clip.startMs;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      let newStartMs = Math.max(0, initialStart + deltaPx / pxPerMs);
      let didSnap = false;

      // Magnetic attraction to other clip edges if enabled
      if (magnetic) {
        const snapThresholdMs = 200;
        for (const track of project.tracks) {
          for (const other of track.clips) {
            if (other.id === clip.id) continue;
            // Snap to end of other clip
            const otherEnd = other.startMs + other.durationMs;
            if (Math.abs(newStartMs - otherEnd) < snapThresholdMs) {
              newStartMs = otherEnd;
              setActiveSnapGuidePx(otherEnd * pxPerMs);
              didSnap = true;
              break;
            } else if (Math.abs(newStartMs - other.startMs) < snapThresholdMs) {
              newStartMs = other.startMs;
              setActiveSnapGuidePx(other.startMs * pxPerMs);
              didSnap = true;
              break;
            }
          }
          if (didSnap) break;
        }
      }

      if (!didSnap) {
        setActiveSnapGuidePx(null);
      }

      moveClip(clip.id, clip.trackId, newStartMs);
    };

    const onMouseUp = () => {
      setActiveSnapGuidePx(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Track Type Specific Styling
  const getTrackThemeClass = () => {
    switch (trackType) {
      case 'text': return 'clip-text-theme';
      case 'pip': return 'clip-pip-theme';
      case 'audio': return 'clip-audio-theme';
      case 'sfx': return 'clip-sfx-theme';
      default: return 'clip-video-theme';
    }
  };

  return (
    <div
      className={`vn-clip-item ${getTrackThemeClass()} ${isSelected ? 'selected' : ''}`}
      style={{
        left: `${leftPx}px`,
        width: `${widthPx}px`
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectClip(clip.id, clip.trackId);
      }}
      onMouseDown={handleClipDrag}
    >
      {/* Left Trim Handle */}
      <div className="trim-handle trim-left" onMouseDown={handleLeftTrim} />

      {/* Clip Content & Metadata */}
      <div className="clip-content-inner">
        <div className="clip-header-line">
          <span className="clip-label">{clip.name}</span>
          {clip.speedCurve && (
            <span className="clip-speed-badge" title="Speed Curve Applied">
              <Zap size={10} />
            </span>
          )}
        </div>

        {/* Audio Waveform Visualization (If Audio/Video has waveform) */}
        {clip.waveformData && clip.waveformData.length > 0 && (
          <div className="clip-waveform-strip">
            {clip.waveformData.map((peak, idx) => (
              <div
                key={idx}
                className="waveform-bar"
                style={{ height: `${Math.max(15, peak * 100)}%` }}
              />
            ))}
          </div>
        )}

        {/* Beat Marker Dots (Edit to the Beat - VN Signature) */}
        {clip.beats && clip.beats.length > 0 && (
          <div className="beat-markers-overlay">
            {clip.beats.map((beatTime, idx) => {
              const beatOffsetMs = beatTime - clip.startMs;
              if (beatOffsetMs >= 0 && beatOffsetMs <= clip.durationMs) {
                const beatLeftPx = beatOffsetMs * pxPerMs;
                return (
                  <div
                    key={idx}
                    className="beat-marker-dot"
                    style={{ left: `${beatLeftPx}px` }}
                    title={`Beat at ${beatTime}ms`}
                  />
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Keyframe Diamond Markers */}
        {clip.keyframes && clip.keyframes.length > 0 && (
          <div className="keyframes-overlay">
            {clip.keyframes.map((kf) => {
              const kfOffsetMs = kf.timeMs - clip.startMs;
              if (kfOffsetMs >= 0 && kfOffsetMs <= clip.durationMs) {
                const kfLeftPx = kfOffsetMs * pxPerMs;
                return (
                  <div
                    key={kf.id}
                    className="kf-diamond-marker"
                    style={{ left: `${kfLeftPx}px` }}
                    title={`Keyframe at ${kf.timeMs}ms`}
                  >
                    <Diamond size={10} fill="#FFB300" color="#FFB300" />
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>

      {/* Right Trim Handle */}
      <div className="trim-handle trim-right" onMouseDown={handleRightTrim} />

      <style>{`
        .vn-clip-item {
          position: absolute;
          top: 4px;
          bottom: 4px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          cursor: grab;
          user-select: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
          display: flex;
        }

        .vn-clip-item:active {
          cursor: grabbing;
        }

        /* Track Theming */
        .clip-video-theme {
          background: linear-gradient(180deg, #182236 0%, #101726 100%);
          border: 1px solid #2B3B5E;
        }

        .clip-text-theme {
          background: linear-gradient(180deg, #2D143D 0%, #1C0C26 100%);
          border: 1px solid #7B2CBF;
        }

        .clip-pip-theme {
          background: linear-gradient(180deg, #0D3326 0%, #071F17 100%);
          border: 1px solid #00F5A0;
        }

        .clip-audio-theme {
          background: linear-gradient(180deg, #33240D 0%, #1F1507 100%);
          border: 1px solid #FFB300;
        }

        .clip-sfx-theme {
          background: linear-gradient(180deg, #33121E 0%, #1F0711 100%);
          border: 1px solid #FF3366;
        }

        .vn-clip-item.selected {
          border-color: #00F2FE !important;
          box-shadow: 0 0 12px rgba(0, 242, 254, 0.5), inset 0 0 0 1px #00F2FE;
        }

        .trim-handle {
          width: 8px;
          height: 100%;
          cursor: ew-resize;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .trim-left {
          background: linear-gradient(90deg, rgba(0, 242, 254, 0.8), transparent);
        }

        .trim-right {
          background: linear-gradient(-90deg, rgba(0, 242, 254, 0.8), transparent);
        }

        .vn-clip-item:hover .trim-handle,
        .vn-clip-item.selected .trim-handle {
          opacity: 1;
        }

        .clip-content-inner {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 4px 6px;
          overflow: hidden;
          position: relative;
        }

        .clip-header-line {
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 5;
        }

        .clip-label {
          font-size: 11px;
          font-weight: 600;
          color: #FFF;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .clip-speed-badge {
          display: flex;
          align-items: center;
          color: var(--accent-cyan);
          background: rgba(0, 242, 254, 0.2);
          border-radius: 2px;
          padding: 1px;
        }

        .clip-waveform-strip {
          position: absolute;
          bottom: 4px;
          left: 6px;
          right: 6px;
          height: 20px;
          display: flex;
          align-items: flex-end;
          gap: 2px;
          opacity: 0.65;
          pointer-events: none;
        }

        .waveform-bar {
          flex: 1;
          background: #FFB300;
          border-radius: 1px;
          min-width: 2px;
        }

        .beat-markers-overlay {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          pointer-events: none;
        }

        .beat-marker-dot {
          position: absolute;
          bottom: 2px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #00F5A0;
          box-shadow: 0 0 6px #00F5A0;
          transform: translateX(-50%);
        }

        .keyframes-overlay {
          position: absolute;
          top: 2px;
          left: 0;
          right: 0;
          pointer-events: none;
        }

        .kf-diamond-marker {
          position: absolute;
          transform: translateX(-50%);
          filter: drop-shadow(0 0 4px rgba(255, 179, 0, 0.8));
        }
      `}</style>
    </div>
  );
};
