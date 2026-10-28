import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { ClipItem } from './ClipItem';
import { Playhead } from './Playhead';
import { TimecodeRuler } from './TimecodeRuler';
import {
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  Layers,
  Video,
  Music,
  Zap
} from 'lucide-react';

export const TimelineTracks: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { project, pxPerMs, setCurrentTime, activeSnapGuidePx } = useEditorStore();

  const totalWidthPx = Math.max(1600, project.canvas.durationMs * pxPerMs + 400);

  const toggleTrackMute = (trackId: string) => {
    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, muted: !t.muted } : t
        )
      }
    }));
  };

  const toggleTrackVisible = (trackId: string) => {
    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, visible: !t.visible } : t
        )
      }
    }));
  };

  const toggleTrackLock = (trackId: string) => {
    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        tracks: state.project.tracks.map((t) =>
          t.id === trackId ? { ...t, locked: !t.locked } : t
        )
      }
    }));
  };

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'text': return <Type size={13} className="text-violet" />;
      case 'pip': return <Layers size={13} className="text-emerald" />;
      case 'audio': return <Music size={13} className="text-amber" />;
      case 'sfx': return <Zap size={13} className="text-coral" />;
      default: return <Video size={13} className="text-cyan" />;
    }
  };

  return (
    <div className="vn-tracks-workspace">
      {/* Track Control Headers (Pinned Left Column) */}
      <div className="track-headers-column">
        {/* Placeholder spacer aligning with Timecode Ruler */}
        <div className="ruler-spacer">
          <span className="spacer-label">TRACKS</span>
        </div>

        {project.tracks.map((track) => (
          <div key={track.id} className="track-header-cell">
            <div className="header-meta">
              {getTrackIcon(track.type)}
              <span className="track-title">{track.name}</span>
            </div>

            <div className="header-actions">
              <button
                onClick={() => toggleTrackVisible(track.id)}
                className={`btn-icon-sm ${!track.visible ? 'active-mute' : ''}`}
                title="Toggle Visibility"
              >
                {track.visible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>

              <button
                onClick={() => toggleTrackMute(track.id)}
                className={`btn-icon-sm ${track.muted ? 'active-mute' : ''}`}
                title="Mute Track"
              >
                {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>

              <button
                onClick={() => toggleTrackLock(track.id)}
                className={`btn-icon-sm ${track.locked ? 'active-lock' : ''}`}
                title="Lock Track"
              >
                {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable Tracks Canvas & Playhead */}
      <div className="track-lanes-scroll-area" ref={scrollContainerRef}>
        {/* Synchronized Timecode Ruler */}
        <TimecodeRuler totalWidthPx={totalWidthPx} />

        {/* Tracks Content Area */}
        <div
          className="lanes-board"
          style={{ width: `${totalWidthPx}px` }}
          onClick={(e) => {
            // Click empty area to set playhead
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            setCurrentTime(clickX / pxPerMs);
          }}
        >
          {/* Vertical Playhead spanning all lanes */}
          <Playhead />

          {/* Magnetic Snap Guide Line (Action Item 3) */}
          {activeSnapGuidePx !== null && (
            <div
              className="magnetic-snap-guide-line"
              style={{ left: `${activeSnapGuidePx}px` }}
            >
              <span className="magnetic-snap-badge">SNAP</span>
            </div>
          )}

          {/* Lane Rows */}
          {project.tracks.map((track) => (
            <div
              key={track.id}
              className={`track-lane-row ${track.type === 'video' ? 'main-lane' : ''}`}
            >
              {track.clips.map((clip) => (
                <ClipItem key={clip.id} clip={clip} trackType={track.type} />
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .vn-tracks-workspace {
          display: flex;
          flex: 1;
          height: 100%;
          overflow: hidden;
          background: var(--bg-base);
          position: relative;
        }

        .track-headers-column {
          width: 170px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          z-index: 20;
        }

        .ruler-spacer {
          height: var(--ruler-height);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          padding: 0 10px;
          background: var(--bg-surface);
        }

        .spacer-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }

        .track-header-cell {
          height: var(--track-height);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px 0 10px;
          background: var(--bg-surface-elevated);
        }

        .header-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }

        .track-title {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .btn-icon-sm {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border-radius: 3px;
          transition: all 0.15s ease;
        }

        .btn-icon-sm:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
        }

        .active-mute {
          color: var(--accent-coral) !important;
        }

        .active-lock {
          color: var(--accent-amber) !important;
        }

        .track-lanes-scroll-area {
          flex: 1;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          position: relative;
        }

        .lanes-board {
          position: relative;
          min-height: calc(100% - var(--ruler-height));
        }

        .track-lane-row {
          height: var(--track-height);
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
          background: rgba(17, 20, 26, 0.4);
        }

        .track-lane-row.main-lane {
          background: rgba(0, 242, 254, 0.03);
        }

        .magnetic-snap-guide-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--accent-emerald);
          box-shadow: 0 0 12px var(--accent-emerald), 0 0 2px #FFF;
          z-index: 60;
          pointer-events: none;
        }

        .magnetic-snap-badge {
          position: absolute;
          top: 2px;
          left: 4px;
          font-size: 8px;
          font-weight: 800;
          color: #000;
          background: var(--accent-emerald);
          padding: 1px 4px;
          border-radius: 2px;
          letter-spacing: 0.5px;
        }

        .text-cyan { color: var(--accent-cyan); }
        .text-violet { color: var(--accent-purple); }
        .text-emerald { color: var(--accent-emerald); }
        .text-amber { color: var(--accent-amber); }
        .text-coral { color: var(--accent-coral); }
      `}</style>
    </div>
  );
};
