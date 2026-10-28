import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { apiListProjects, apiDeleteProject } from '../services/api';
import { VNProject } from '../types';
import {
  X,
  FolderKanban,
  Save,
  Trash2,
  FolderOpen,
  Clock,
  Layers,
  Database,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ProjectsModal: React.FC = () => {
  const {
    showProjectsModal,
    setShowProjectsModal,
    project,
    saveProjectToCloud,
    loadCloudProject,
    user,
    setShowAuthModal,
    infrastructure
  } = useEditorStore();

  const [projectsList, setProjectsList] = useState<VNProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingCurrent, setSavingCurrent] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const list = await apiListProjects();
      setProjectsList(list);
    } catch (err: any) {
      console.warn('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showProjectsModal) {
      fetchProjects();
    }
  }, [showProjectsModal]);

  if (!showProjectsModal) return null;

  const handleSaveCurrent = async () => {
    setSavingCurrent(true);
    setNotification(null);
    try {
      const ok = await saveProjectToCloud();
      if (ok) {
        setNotification({ type: 'success', message: 'Project successfully saved to PostgreSQL database!' });
        await fetchProjects();
      } else {
        setNotification({ type: 'error', message: 'Failed to save project. Ensure backend server is connected.' });
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Save error' });
    } finally {
      setSavingCurrent(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await apiDeleteProject(id);
      setProjectsList((prev) => prev.filter((p) => p.id !== id));
      setNotification({ type: 'success', message: `Deleted project "${title}"` });
      setTimeout(() => setNotification(null), 2500);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete' });
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="vn-projects-dialog">
        {/* Header */}
        <div className="projects-header">
          <div className="projects-title-box">
            <div className="projects-icon-box">
              <FolderKanban size={18} className="cyan-icon" />
            </div>
            <div>
              <div className="title-row">
                <h3 className="projects-title">Cloud Projects</h3>
                <span className="db-badge">
                  <Database size={11} />
                  <span>{infrastructure?.database || 'PostgreSQL'}</span>
                </span>
              </div>
              <p className="projects-subtitle">
                {user ? `Logged in as ${user.name} (${user.email})` : 'Guest Session — Sign in to sync across devices'}
              </p>
            </div>
          </div>

          <div className="header-actions">
            {!user && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="btn-secondary sign-in-btn"
              >
                Sign In
              </button>
            )}
            <button
              onClick={() => setShowProjectsModal(false)}
              className="btn-icon close-btn"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toolbar: Save Current Project */}
        <div className="projects-toolbar">
          <div className="current-summary">
            <span className="summary-label">Active Timeline:</span>
            <span className="summary-title">{project.title}</span>
            <span className="summary-clips">
              ({project.tracks.reduce((acc, t) => acc + t.clips.length, 0)} clips • {project.canvas.aspectRatio})
            </span>
          </div>

          <button
            onClick={handleSaveCurrent}
            disabled={savingCurrent}
            className="btn-primary save-btn"
          >
            {savingCurrent ? (
              <Loader2 size={14} className="spin-anim" />
            ) : (
              <Save size={14} />
            )}
            <span>Save Active to Cloud</span>
          </button>
        </div>

        {/* Notification Alert */}
        {notification && (
          <div className={`projects-alert ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Projects Grid / List */}
        <div className="projects-content">
          {loading ? (
            <div className="projects-loading-state">
              <Loader2 size={24} className="spin-anim cyan-icon" />
              <span>Querying PostgreSQL database...</span>
            </div>
          ) : projectsList.length === 0 ? (
            <div className="projects-empty-state">
              <FolderKanban size={38} className="text-muted" />
              <h4>No Cloud Projects Found</h4>
              <p>Save your current active timeline to store your work safely in the PostgreSQL database.</p>
              <button onClick={handleSaveCurrent} className="btn-primary save-first-btn">
                <Plus size={14} />
                <span>Save Current Project Now</span>
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {projectsList.map((p) => {
                const totalClips = p.tracks.reduce((sum, t) => sum + (t.clips?.length || 0), 0);
                const isCurrent = p.id === project.id;

                return (
                  <div key={p.id} className={`project-card ${isCurrent ? 'current-active' : ''}`}>
                    <div className="card-top">
                      <div className="card-title-group">
                        <h4 className="card-title" title={p.title}>{p.title}</h4>
                        {isCurrent && <span className="active-pill">ACTIVE</span>}
                      </div>
                      <span className="aspect-pill">{p.canvas.aspectRatio}</span>
                    </div>

                    <div className="card-meta">
                      <div className="meta-item">
                        <Clock size={12} />
                        <span>{(p.canvas.durationMs / 1000).toFixed(0)}s Duration</span>
                      </div>
                      <div className="meta-item">
                        <Layers size={12} />
                        <span>{p.tracks.length} Tracks • {totalClips} Clips</span>
                      </div>
                      <div className="meta-item timestamp">
                        <span>v{p.version} • {p.canvas.width}x{p.canvas.height}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button
                        onClick={() => loadCloudProject(p)}
                        className="btn-open-proj"
                        title="Load into Timeline"
                      >
                        <FolderOpen size={13} />
                        <span>Open in Editor</span>
                      </button>

                      <button
                        onClick={() => handleDelete(p.id, p.title)}
                        className="btn-delete-proj"
                        title="Delete project"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .vn-projects-dialog {
          width: 680px;
          max-height: 80vh;
          background: var(--bg-surface);
          border: 1px solid var(--border-medium);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65), 0 0 40px rgba(0, 242, 254, 0.08);
          display: flex;
          flex-direction: column;
          animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .projects-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .projects-title-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .projects-icon-box {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-md);
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .projects-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .db-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          background: rgba(0, 242, 254, 0.1);
          color: var(--accent-cyan);
          border: 1px solid rgba(0, 242, 254, 0.25);
        }

        .projects-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          margin: 3px 0 0 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sign-in-btn {
          padding: 4px 10px;
          font-size: 11px;
        }

        .projects-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--border-subtle);
        }

        .current-summary {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .summary-label {
          color: var(--text-muted);
        }

        .summary-title {
          font-weight: 700;
          color: var(--text-primary);
        }

        .summary-clips {
          font-size: 11px;
          color: var(--accent-cyan);
        }

        .save-btn {
          height: 32px;
          padding: 0 14px;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .projects-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: var(--radius-sm);
          font-size: 11px;
          margin-top: 12px;
        }

        .projects-alert.success {
          background: rgba(0, 242, 254, 0.12);
          border: 1px solid rgba(0, 242, 254, 0.3);
          color: var(--accent-cyan);
        }

        .projects-alert.error {
          background: rgba(255, 68, 68, 0.12);
          border: 1px solid rgba(255, 68, 68, 0.3);
          color: #FF5E5E;
        }

        .projects-content {
          margin-top: 16px;
          overflow-y: auto;
          max-height: 480px;
          padding-right: 4px;
        }

        .projects-loading-state, .projects-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 16px;
          text-align: center;
          color: var(--text-muted);
          gap: 10px;
        }

        .projects-empty-state h4 {
          color: var(--text-primary);
          margin: 0;
          font-size: 15px;
        }

        .projects-empty-state p {
          font-size: 12px;
          max-width: 320px;
          margin: 0;
        }

        .save-first-btn {
          margin-top: 8px;
          font-size: 12px;
          height: 34px;
        }

        .projects-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .project-card {
          background: var(--bg-surface-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .project-card:hover {
          border-color: var(--border-medium);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
        }

        .project-card.current-active {
          border-color: rgba(0, 242, 254, 0.4);
          background: linear-gradient(180deg, rgba(0, 242, 254, 0.05), var(--bg-surface-elevated));
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }

        .card-title-group {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow: hidden;
        }

        .card-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .active-pill {
          font-size: 8px;
          font-weight: 800;
          background: var(--accent-cyan);
          color: #000;
          padding: 1px 4px;
          border-radius: var(--radius-sm);
        }

        .aspect-pill {
          font-size: 9px;
          font-family: var(--font-mono);
          background: var(--bg-base);
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          border: 1px solid var(--border-subtle);
        }

        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .meta-item.timestamp {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        .card-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
        }

        .btn-open-proj {
          flex: 1;
          height: 28px;
          background: var(--bg-surface-active);
          border: 1px solid var(--border-medium);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-open-proj:hover {
          background: var(--accent-cyan);
          color: #000;
          border-color: var(--accent-cyan);
        }

        .btn-delete-proj {
          width: 28px;
          height: 28px;
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-muted);
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-delete-proj:hover {
          color: #FF5E5E;
          background: rgba(255, 68, 68, 0.1);
          border-color: rgba(255, 68, 68, 0.3);
        }
      `}</style>
    </div>
  );
};
