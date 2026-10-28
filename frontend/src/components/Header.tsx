import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { AspectRatio } from '../types';
import {
  Undo2,
  Redo2,
  Download,
  Grid,
  Magnet,
  Layers,
  Monitor,
  HelpCircle,
  FolderKanban,
  Cloud,
  Check,
  Loader2,
  LogIn,
  LogOut,
  Database,
  Cpu
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
    toggleShortcutsModal,
    setShowAuthModal,
    setShowProjectsModal,
    saveProjectToCloud,
    isSavingProject,
    lastSavedTime,
    user,
    logout,
    infrastructure
  } = useEditorStore();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const aspectRatios: AspectRatio[] = ['16:9', '9:16', '1:1', '4:5', '21:9'];

  const handleCloudSave = async () => {
    const ok = await saveProjectToCloud();
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  return (
    <header className="vn-header">
      {/* Left: Brand, Project Name & Cloud Database Persistence */}
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

        {/* Cloud Project Manager & Quick Save */}
        <div className="cloud-actions-group">
          <button
            onClick={() => setShowProjectsModal(true)}
            className="btn-header-secondary"
            title="Manage Cloud Projects (PostgreSQL)"
          >
            <FolderKanban size={14} className="cyan-icon" />
            <span>Projects</span>
          </button>

          <button
            onClick={handleCloudSave}
            disabled={isSavingProject}
            className={`btn-header-secondary save-action-btn ${saveSuccess ? 'save-success' : ''}`}
            title="Save timeline state to PostgreSQL"
          >
            {isSavingProject ? (
              <Loader2 size={13} className="spin-anim" />
            ) : saveSuccess ? (
              <Check size={13} className="green-icon" />
            ) : (
              <Cloud size={13} />
            )}
            <span>
              {isSavingProject
                ? 'Saving...'
                : saveSuccess
                ? 'Saved'
                : 'Save'}
            </span>
          </button>
        </div>
      </div>

      {/* Center: Canvas Aspect Ratio & Format */}
      <div className="vn-header-center">
        <div className="aspect-ratio-selector">
          <Monitor size={13} className="selector-icon" />
          <select
            value={project.canvas.aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="aspect-dropdown"
          >
            {aspectRatios.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
        </div>

        <div className="resolution-badge">
          <span className="res-tag">{project.canvas.width}x{project.canvas.height}</span>
          <span className="fps-tag">{project.canvas.fps} FPS</span>
        </div>
      </div>

      {/* Right: History, Guides, Infrastructure Status, User Profile & Export */}
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

        <div className="header-divider" />

        {/* Live Infrastructure Status Indicator (Pillar 56) */}
        <div
          className="infra-pill"
          title={`Database: ${infrastructure?.database || 'PostgreSQL'}\nJob Queue: ${infrastructure?.jobQueue || 'BullMQ Redis'}\nStorage: ${infrastructure?.storage || 'S3 Cloud'}`}
        >
          <span className="live-dot" />
          <Database size={11} className="infra-icon" />
          <span className="infra-label">Postgres • Redis</span>
        </div>

        {/* User Account / Auth */}
        {user ? (
          <div className="user-profile-box">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="user-profile-btn"
              title="User Account"
            >
              <div className="user-avatar-circle">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="user-name-label">{user.name.split(' ')[0]}</span>
              <span className="user-pro-badge">PRO</span>
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu">
                <div className="user-info-row">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <div className="dropdown-divider" />
                <button
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowProjectsModal(true);
                  }}
                  className="dropdown-item"
                >
                  <FolderKanban size={14} />
                  <span>My Cloud Projects</span>
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="dropdown-item logout-item"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="btn-signin"
            title="Sign in to save projects to cloud database"
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>
        )}

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
          padding: 0 10px;
          z-index: 100;
          gap: 8px;
        }

        .vn-header-left {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .vn-header-center {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .vn-header-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
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
          max-width: 170px;
        }

        .vn-project-title-input:hover {
          background: var(--bg-surface-hover);
          border-color: var(--border-medium);
        }

        .vn-project-title-input:focus {
          background: var(--bg-surface-active);
          border-color: var(--accent-cyan);
        }

        .cloud-actions-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .btn-header-secondary {
          height: 28px;
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          padding: 0 9px;
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-header-secondary:hover {
          background: var(--bg-surface-hover);
          color: var(--text-primary);
          border-color: var(--border-medium);
        }

        .save-action-btn.save-success {
          border-color: #00E676;
          color: #00E676;
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

        .infra-pill {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 242, 254, 0.06);
          border: 1px solid rgba(0, 242, 254, 0.2);
          border-radius: var(--radius-sm);
          padding: 3px 8px;
          cursor: default;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00F2FE;
          box-shadow: 0 0 6px #00F2FE;
          animation: pulseDot 2s infinite ease-in-out;
        }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }

        .infra-icon {
          color: var(--accent-cyan);
        }

        .infra-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .user-profile-box {
          position: relative;
        }

        .user-profile-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-medium);
          padding: 3px 8px 3px 4px;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-profile-btn:hover {
          border-color: var(--accent-cyan);
        }

        .user-avatar-circle {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00F2FE, #4FACFE);
          color: #000;
          font-weight: 800;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-name-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .user-pro-badge {
          font-size: 8px;
          font-weight: 800;
          background: rgba(0, 242, 254, 0.2);
          color: var(--accent-cyan);
          padding: 1px 4px;
          border-radius: 4px;
        }

        .user-dropdown-menu {
          position: absolute;
          top: 36px;
          right: 0;
          width: 200px;
          background: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-md);
          padding: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .user-info-row {
          display: flex;
          flex-direction: column;
          padding: 6px 8px;
        }

        .user-info-row strong {
          font-size: 12px;
          color: var(--text-primary);
        }

        .user-info-row span {
          font-size: 11px;
          color: var(--text-muted);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 4px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: var(--bg-surface-elevated);
          color: var(--text-primary);
        }

        .logout-item:hover {
          color: #FF5E5E;
          background: rgba(255, 68, 68, 0.1);
        }

        .btn-signin {
          display: flex;
          align-items: center;
          gap: 6px;
          height: 28px;
          padding: 0 10px;
          background: rgba(0, 242, 254, 0.1);
          border: 1px solid rgba(0, 242, 254, 0.35);
          color: var(--accent-cyan);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-signin:hover {
          background: var(--accent-cyan);
          color: #000;
          box-shadow: 0 0 12px rgba(0, 242, 254, 0.4);
        }

        .disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .export-button {
          margin-left: 6px;
          letter-spacing: 0.5px;
        }

        .spin-anim {
          animation: spin 1s linear infinite;
        }

        .green-icon {
          color: #00E676;
        }
      `}</style>
    </header>
  );
};
