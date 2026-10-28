import React from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  Sliders,
  Move,
  Maximize,
  RotateCw,
  RotateCcw,
  Scan,
  Maximize2,
  Sun,
  Volume2,
  Diamond,
  Trash2,
  Type
} from 'lucide-react';

export const Inspector: React.FC = () => {
  const {
    project,
    selectedClipId,
    updateClipTransform,
    updateClipColor,
    addKeyframeToClip,
    removeKeyframeFromClip,
    removeClip,
    fitClipToCanvas
  } = useEditorStore();

  // Find currently selected clip across tracks
  let selectedClip = null;
  let trackName = '';
  for (const track of project.tracks) {
    const match = track.clips.find((c) => c.id === selectedClipId);
    if (match) {
      selectedClip = match;
      trackName = track.name;
      break;
    }
  }

  if (!selectedClip) {
    return (
      <aside className="vn-inspector-empty">
        <Sliders size={28} className="empty-icon" />
        <span className="empty-title">No Clip Selected</span>
        <span className="empty-desc">Click any clip on the timeline to edit transforms, keyframes, color grading, and speed curves.</span>
        <style>{`
          .vn-inspector-empty {
            width: var(--inspector-width);
            height: 100%;
            background: var(--bg-surface);
            border-left: 1px solid var(--border-subtle);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px;
            text-align: center;
            color: var(--text-muted);
          }
          .empty-icon {
            color: var(--border-strong);
            margin-bottom: 12px;
          }
          .empty-title {
            font-size: 14px;
            font-weight: 700;
            color: var(--text-secondary);
            margin-bottom: 6px;
          }
          .empty-desc {
            font-size: 11px;
            line-height: 1.5;
          }
        `}</style>
      </aside>
    );
  }

  const { transform, colorAdjustments, keyframes } = selectedClip;

  return (
    <aside className="vn-inspector">
      {/* Header with Title and Actions */}
      <div className="inspector-header">
        <div className="clip-title-info">
          <span className="track-badge">{trackName}</span>
          <span className="clip-name">{selectedClip.name}</span>
        </div>
        <div className="inspector-header-actions">
          <button
            onClick={() => fitClipToCanvas(selectedClip.id, 'reset')}
            className="btn-icon"
            title="Reset Transform to Defaults"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={() => removeClip(selectedClip.id)}
            className="btn-icon delete-btn"
            title="Delete Clip (Del)"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="inspector-scroll-area">
        {/* TEXT LAYER PROPERTIES (If Text Clip) */}
        {selectedClip.textData && (
          <div className="inspector-section">
            <div className="section-header">
              <Type size={14} className="sec-icon" />
              <span>Typography Content</span>
            </div>
            <textarea
              className="text-edit-area"
              value={selectedClip.textData.text}
              onChange={(e) => {
                const val = e.target.value;
                useEditorStore.setState((state) => ({
                  project: {
                    ...state.project,
                    tracks: state.project.tracks.map((t) => ({
                      ...t,
                      clips: t.clips.map((c) =>
                        c.id === selectedClip!.id
                          ? { ...c, textData: { ...c.textData!, text: val } }
                          : c
                      )
                    }))
                  }
                }));
              }}
              rows={2}
            />
            <div className="control-row">
              <span className="control-label">Font Size</span>
              <input
                type="range"
                min="20"
                max="120"
                value={selectedClip.textData.fontSize}
                onChange={(e) => {
                  const size = Number(e.target.value);
                  useEditorStore.setState((state) => ({
                    project: {
                      ...state.project,
                      tracks: state.project.tracks.map((t) => ({
                        ...t,
                        clips: t.clips.map((c) =>
                          c.id === selectedClip!.id
                            ? { ...c, textData: { ...c.textData!, fontSize: size } }
                            : c
                        )
                      }))
                    }
                  }));
                }}
                className="slider-input"
              />
              <span className="val-badge">{selectedClip.textData.fontSize}px</span>
            </div>
          </div>
        )}

        {/* TRANSFORM CONTROLS */}
        <div className="inspector-section">
          <div className="section-header">
            <Move size={14} className="sec-icon" />
            <span>Transform Coordinates</span>
          </div>

          {/* Quick Fit / Fill / Center Actions (Action Item 2) */}
          <div className="transform-presets-row">
            <button
              onClick={() => fitClipToCanvas(selectedClip.id, 'fit')}
              className="transform-quick-btn"
              title="Scale to Fit Screen"
            >
              <Scan size={12} />
              <span>Fit</span>
            </button>
            <button
              onClick={() => fitClipToCanvas(selectedClip.id, 'fill')}
              className="transform-quick-btn"
              title="Scale to Fill Screen (Crop)"
            >
              <Maximize2 size={12} />
              <span>Fill</span>
            </button>
            <button
              onClick={() => updateClipTransform(selectedClip.id, { x: 0, y: 0 })}
              className="transform-quick-btn"
              title="Center Position Anchor"
            >
              <Move size={12} />
              <span>Center</span>
            </button>
            <button
              onClick={() => fitClipToCanvas(selectedClip.id, 'reset')}
              className="transform-quick-btn"
              title="Reset Transform (100% scale, 0 rotation)"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="control-row">
            <span className="control-label">Position X</span>
            <input
              type="range"
              min="-400"
              max="400"
              value={transform.x}
              onChange={(e) => updateClipTransform(selectedClip.id, { x: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{Math.round(transform.x)}px</span>
          </div>

          <div className="control-row">
            <span className="control-label">Position Y</span>
            <input
              type="range"
              min="-400"
              max="400"
              value={transform.y}
              onChange={(e) => updateClipTransform(selectedClip.id, { y: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{Math.round(transform.y)}px</span>
          </div>

          <div className="control-row">
            <span className="control-label">Scale</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.05"
              value={transform.scale}
              onChange={(e) => updateClipTransform(selectedClip.id, { scale: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{Math.round(transform.scale * 100)}%</span>
          </div>

          <div className="control-row">
            <span className="control-label">Rotation</span>
            <input
              type="range"
              min="0"
              max="360"
              value={transform.rotation}
              onChange={(e) => updateClipTransform(selectedClip.id, { rotation: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{Math.round(transform.rotation)}°</span>
          </div>

          <div className="control-row">
            <span className="control-label">Opacity</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={transform.opacity}
              onChange={(e) => updateClipTransform(selectedClip.id, { opacity: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{Math.round(transform.opacity * 100)}%</span>
          </div>
        </div>

        {/* VN KEYFRAME DIAMONDS (Signature VN Feature) */}
        <div className="inspector-section">
          <div className="section-header">
            <Diamond size={14} className="sec-icon amber" />
            <span>Keyframe Diamonds ({keyframes?.length || 0})</span>
          </div>

          <button
            onClick={() => addKeyframeToClip(selectedClip.id, 'scale', { scale: transform.scale, opacity: transform.opacity })}
            className="add-keyframe-btn"
          >
            <Diamond size={13} fill="#FFB300" color="#FFB300" />
            <span>Add Keyframe at Playhead</span>
          </button>

          {keyframes && keyframes.length > 0 && (
            <div className="keyframe-list">
              {keyframes.map((kf, i) => (
                <div key={kf.id} className="kf-item">
                  <div className="kf-info">
                    <span className="kf-dot">◆</span>
                    <span className="kf-label">KF #{i + 1} ({Math.round(kf.timeMs)}ms)</span>
                  </div>
                  <button
                    onClick={() => removeKeyframeFromClip(selectedClip.id, kf.id)}
                    className="kf-del-btn"
                    title="Remove Keyframe"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COLOR ADJUSTMENTS */}
        <div className="inspector-section">
          <div className="section-header">
            <Sun size={14} className="sec-icon" />
            <span>Color Grading & Adjustments</span>
          </div>

          <div className="control-row">
            <span className="control-label">Brightness</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorAdjustments.brightness}
              onChange={(e) => updateClipColor(selectedClip.id, { brightness: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{colorAdjustments.brightness}</span>
          </div>

          <div className="control-row">
            <span className="control-label">Contrast</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorAdjustments.contrast}
              onChange={(e) => updateClipColor(selectedClip.id, { contrast: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{colorAdjustments.contrast}</span>
          </div>

          <div className="control-row">
            <span className="control-label">Saturation</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={colorAdjustments.saturation}
              onChange={(e) => updateClipColor(selectedClip.id, { saturation: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{colorAdjustments.saturation}</span>
          </div>

          <div className="control-row">
            <span className="control-label">Vignette</span>
            <input
              type="range"
              min="0"
              max="100"
              value={colorAdjustments.vignette}
              onChange={(e) => updateClipColor(selectedClip.id, { vignette: Number(e.target.value) })}
              className="slider-input"
            />
            <span className="val-badge">{colorAdjustments.vignette}%</span>
          </div>
        </div>

        {/* AUDIO VOLUME CONTROLS */}
        <div className="inspector-section">
          <div className="section-header">
            <Volume2 size={14} className="sec-icon" />
            <span>Audio & Volume</span>
          </div>

          <div className="control-row">
            <span className="control-label">Volume</span>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={selectedClip.volume}
              onChange={(e) => {
                const vol = Number(e.target.value);
                useEditorStore.setState((state) => ({
                  project: {
                    ...state.project,
                    tracks: state.project.tracks.map((t) => ({
                      ...t,
                      clips: t.clips.map((c) => (c.id === selectedClip!.id ? { ...c, volume: vol } : c))
                    }))
                  }
                }));
              }}
              className="slider-input"
            />
            <span className="val-badge">{Math.round(selectedClip.volume * 100)}%</span>
          </div>
        </div>
      </div>

      <style>{`
        .vn-inspector {
          width: var(--inspector-width);
          height: 100%;
          background: var(--bg-surface);
          border-left: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
        }

        .inspector-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--bg-base);
        }

        .clip-title-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .track-badge {
          font-size: 10px;
          color: var(--accent-cyan);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .clip-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .inspector-header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .delete-btn:hover {
          color: var(--accent-coral);
          background: rgba(255, 51, 102, 0.15);
        }

        .transform-presets-row {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }

        .transform-quick-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 6px;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .transform-quick-btn:hover {
          color: var(--accent-cyan);
          background: var(--bg-surface-hover);
          border-color: var(--border-medium);
        }

        .inspector-scroll-area {
          flex: 1;
          overflow-y: auto;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .inspector-section {
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }

        .sec-icon {
          color: var(--accent-cyan);
        }

        .sec-icon.amber {
          color: var(--accent-amber);
        }

        .control-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .control-label {
          font-size: 11px;
          color: var(--text-muted);
          width: 80px;
          flex-shrink: 0;
        }

        .slider-input {
          flex: 1;
          accent-color: var(--accent-cyan);
          cursor: pointer;
        }

        .val-badge {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-secondary);
          width: 48px;
          text-align: right;
          flex-shrink: 0;
        }

        .add-keyframe-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          background: rgba(255, 179, 0, 0.12);
          border: 1px solid rgba(255, 179, 0, 0.3);
          border-radius: var(--radius-sm);
          color: var(--accent-amber);
          font-size: 11px;
          font-weight: 700;
          transition: all 0.15s ease;
        }

        .add-keyframe-btn:hover {
          background: rgba(255, 179, 0, 0.22);
        }

        .keyframe-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .kf-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px;
          background: var(--bg-surface);
          border-radius: var(--radius-sm);
          font-size: 11px;
        }

        .kf-info {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .kf-dot {
          color: var(--accent-amber);
          font-size: 10px;
        }

        .kf-label {
          font-family: var(--font-mono);
          color: var(--text-secondary);
        }

        .kf-del-btn {
          color: var(--text-muted);
        }

        .kf-del-btn:hover {
          color: var(--accent-coral);
        }

        .text-edit-area {
          background: var(--bg-base);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          padding: 8px;
          font-size: 12px;
          outline: none;
          resize: vertical;
        }

        .text-edit-area:focus {
          border-color: var(--accent-cyan);
        }
      `}</style>
    </aside>
  );
};
