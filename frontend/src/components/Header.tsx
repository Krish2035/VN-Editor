import React from 'react';
import { useEditorStore } from '../store/editorStore';
import { AspectRatio } from '../types';
import {
  Undo2,
  Redo2,
  Download,
  Grid,
  Magnet,
  Layers,
  Sparkles,
  Monitor,
  HelpCircle
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    project,
    history,
    setProjectTitle,
    setAspectRatio,
    undo,
    redo,
    showSafeMargins,
    toggleSafeMargins,
    magnetic,
    toggleMagnetic,
    rippleEdit,
    toggleRipple,
    setShowExportModal,
    toggleShortcutsModal
  } = useEditorStore();

  const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:5', '21:9'];

  return (
    <header className="vn-header">
      {/* Left: Brand & Project Name */}
      <div className="vn-header-left">
        <div className="vn-logo-badge">
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="22" fill="#0E121A" />
            <path
              d="M24 28 L50 74 L76 28"
              stroke="#00F2FE"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="vn-brand-text">VN</span>
          <span className="vn-version-pill">WEB PRO</span>
        </div>

        <div className="vn-title-container">
          <input
            type="text"
            className="vn-project-title-input"
            value={project.title}
            onChange={(e) => setProjectTitle(e.target.value)}
            title="Click to rename project"
          />
        </div>
      </div>

      {/* Center: Canvas Aspect Ratio & Format */}
      <div className="vn-header-center">
        <div className="aspect-ratio-selector">
          <Monitor size={14} className="selector-icon" />
          <select
            value={project.canvas.aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="aspect-dropdown"
          >
            {aspectRatios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio === '16:9' ? '16:9 (YouTube/Landscape)' :
                 ratio === '9:16' ? '9:16 (TikTok/Reels/Shorts)' :
                 ratio === '1:1' ? '1:1 (Square Feed)' :
                 ratio === '4:5' ? '4:5 (Portrait)' : '21:9 (Cinematic UltraWide)'}
              </option>
            ))}
          </select>
        </div>

        <div className="resolution-badge">
          <span className="res-tag">{project.canvas.width}x{project.canvas.height}</span>
          <span className="fps-tag">{project.canvas.fps} FPS</span>
        </div>
      </div>

      {/* Right: History, Guides, Toggles & Export */}
      <div className="vn-header-right">
        {/* Undo / Redo */}
        <div className="history-buttons">
          <button
            onClick={undo}
            disabled={history.past.length === 0}
            className={`btn-icon ${history.past.length === 0 ? 'disabled' : ''}`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={16} />
          </button>
          <button
            onClick={redo}
            disabled={history.future.length === 0}
            className={`btn-icon ${history.future.length === 0 ? 'disabled' : ''}`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="header-divider" />

        {/* Toggles */}
        <button
          onClick={toggleSafeMargins}
          className={`btn-icon ${showSafeMargins ? 'active' : ''}`}
          title="Toggle Safe Margins & Guides"
        >
          <Grid size={16} />
        </button>

        <button
          onClick={toggleMagnetic}
          className={`btn-icon ${magnetic ? 'active' : ''}`}
          title="Magnetic Snapping (Auto-snaps clips & playhead)"
        >
          <Magnet size={16} />
        </button>

        <button
          onClick={toggleRipple}
          className={`btn-icon ${rippleEdit ? 'active' : ''}`}
          title="Ripple Edit (Auto-closes gaps upon clip deletion)"
        >
          <Layers size={16} />
        </button>

        <button
          onClick={toggleShortcutsModal}
          className="btn-icon"
          title="Keyboard Shortcuts Cheatsheet (?)"
        >
          <HelpCircle size={16} />
        </button>

        {/* Primary Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          className="btn-primary export-button"
        >
          <Download size={15} />
          <span>EXPORT</span>
        </button>
      </div>

      <style>{`
        .vn-header {
          height: var(--header-height);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 100;
        }

        .vn-header-left, .vn-header-center, .vn-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .vn-logo-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vn-brand-text {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 18px;
          letter-spacing: 1px;
          color: #FFFFFF;
        }

        .vn-version-pill {
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          background: rgba(0, 242, 254, 0.15);
          color: var(--accent-cyan);
          letter-spacing: 0.5px;
        }

        .vn-project-title-input {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          outline: none;
          transition: all 0.2s ease;
          max-width: 200px;
        }

        .vn-project-title-input:hover {
          background: var(--bg-surface-hover);
          border-color: var(--border-medium);
        }

        .vn-project-title-input:focus {
          background: var(--bg-surface-active);
          border-color: var(--accent-cyan);
        }

        .aspect-ratio-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface-elevated);
          padding: 4px 10px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .selector-icon {
          color: var(--accent-cyan);
        }

        .aspect-dropdown {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
          outline: none;
          cursor: pointer;
        }

        .aspect-dropdown option {
          background: var(--bg-surface);
          color: var(--text-primary);
        }

        .resolution-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          background: var(--bg-base);
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }

        .fps-tag {
          color: var(--accent-cyan);
          font-weight: 700;
        }

        .header-divider {
          width: 1px;
          height: 20px;
          background: var(--border-subtle);
        }

        .disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .export-button {
          margin-left: 6px;
          letter-spacing: 0.5px;
        }
      `}</style>
    </header>
  );
};
