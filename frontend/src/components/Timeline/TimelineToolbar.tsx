import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import {
  Scissors,
  Trash2,
  Zap,
  Diamond,
  ZoomIn,
  ZoomOut,
  Magnet,
  Layers,
  Volume2
} from 'lucide-react';

export const TimelineToolbar: React.FC = () => {
  const {
    splitClipAtPlayhead,
    removeClip,
    selectedClipId,
    magnetic,
    toggleMagnetic,
    rippleEdit,
    toggleRipple,
    pxPerMs,
    setZoom,
    setActiveTab,
    addKeyframeToClip
  } = useEditorStore();

  return (
    <div className="vn-timeline-toolbar">
      {/* Left: Editing Operations */}
      <div className="toolbar-group">
        <button
          onClick={splitClipAtPlayhead}
          className="toolbar-btn"
          title="Split Clip at Playhead (Ctrl + B)"
        >
          <Scissors size={15} />
          <span>Split</span>
        </button>

        <button
          onClick={() => {
            if (selectedClipId) removeClip(selectedClipId);
          }}
          disabled={!selectedClipId}
          className={`toolbar-btn ${!selectedClipId ? 'disabled' : ''}`}
          title="Delete Selected Clip (Del)"
        >
          <Trash2 size={15} />
          <span>Delete</span>
        </button>

        <button
          onClick={() => setActiveTab('speed')}
          className="toolbar-btn"
          title="Speed Curve Ramping"
        >
          <Zap size={15} />
          <span>Speed Curve</span>
        </button>

        <button
          onClick={() => {
            if (selectedClipId) addKeyframeToClip(selectedClipId, 'scale', { scale: 1.1 });
          }}
          disabled={!selectedClipId}
          className={`toolbar-btn ${!selectedClipId ? 'disabled' : ''}`}
          title="Add Keyframe Diamond (◆)"
        >
          <Diamond size={14} className="amber-icon" />
          <span>Keyframe</span>
        </button>
      </div>

      {/* Right: Snapping, Ripple & Timeline Zoom */}
      <div className="toolbar-group">
        <button
          onClick={toggleMagnetic}
          className={`toolbar-toggle-btn ${magnetic ? 'active' : ''}`}
          title="Magnetic Snapping (Auto-aligns clips)"
        >
          <Magnet size={14} />
          <span>Magnet</span>
        </button>

        <button
          onClick={toggleRipple}
          className={`toolbar-toggle-btn ${rippleEdit ? 'active' : ''}`}
          title="Ripple Edit (Auto-closes timeline gaps)"
        >
          <Layers size={14} />
          <span>Ripple</span>
        </button>

        <div className="toolbar-divider" />

        {/* Zoom Slider */}
        <div className="zoom-controller">
          <button
            onClick={() => setZoom(pxPerMs * 0.8)}
            className="btn-icon"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <input
            type="range"
            min="0.02"
            max="0.3"
            step="0.01"
            value={pxPerMs}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
            title="Timeline Zoom"
          />

          <button
            onClick={() => setZoom(pxPerMs * 1.25)}
            className="btn-icon"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      <style>{`
        .vn-timeline-toolbar {
          height: var(--timeline-toolbar-height);
          background: var(--bg-surface);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
        }

        .toolbar-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          transition: all 0.15s ease;
        }

        .toolbar-btn:hover:not(.disabled) {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
          border-color: var(--border-medium);
        }

        .toolbar-btn.disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .amber-icon {
          color: var(--accent-amber);
        }

        .toolbar-toggle-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          background: transparent;
          border: 1px solid transparent;
          transition: all 0.15s ease;
        }

        .toolbar-toggle-btn:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
        }

        .toolbar-toggle-btn.active {
          color: var(--accent-cyan);
          background: var(--accent-cyan-dim);
          border-color: rgba(0, 242, 254, 0.3);
        }

        .toolbar-divider {
          width: 1px;
          height: 18px;
          background: var(--border-subtle);
          margin: 0 4px;
        }

        .zoom-controller {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .zoom-slider {
          width: 90px;
          accent-color: var(--accent-cyan);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
