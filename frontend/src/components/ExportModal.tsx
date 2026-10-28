import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { exportProjectLocally } from '../core/clientExporter';
import { getStoredToken } from '../services/api';
import confetti from 'canvas-confetti';
import {
  X,
  Zap,
  Server,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Film,
  Cpu
} from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { project, showExportModal, setShowExportModal } = useEditorStore();

  const [exportMode, setExportMode] = useState<'client' | 'server'>('client');
  const [exportQuality, setExportQuality] = useState<'720p' | '1080p' | '4k'>('1080p');
  const [exportFps, setExportFps] = useState<30 | 60>(60);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!showExportModal) return null;

  const computeDimensions = () => {
    const scale = exportQuality === '4k' ? 2 : exportQuality === '720p' ? 0.667 : 1;
    let baseW = 1920;
    let baseH = 1080;
    const aspect = project.canvas.aspectRatio;

    if (aspect === '9:16') {
      baseW = 1080;
      baseH = 1920;
    } else if (aspect === '1:1') {
      baseW = 1080;
      baseH = 1080;
    } else if (aspect === '4:5') {
      baseW = 1080;
      baseH = 1350;
    } else if (aspect === '21:9') {
      baseW = 2560;
      baseH = 1080;
    }

    return {
      width: Math.round(baseW * scale),
      height: Math.round(baseH * scale)
    };
  };

  const getExportProject = () => {
    const { width, height } = computeDimensions();
    return {
      ...project,
      canvas: {
        ...project.canvas,
        width,
        height,
        fps: exportFps
      }
    };
  };

  // Client-Side Instant Export
  const handleClientExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setErrorMessage(null);
      setDownloadUrl(null);

      const exportProject = getExportProject();
      const blob = await exportProjectLocally(exportProject, (pct, frame, total) => {
        setProgress(pct);
        setCurrentFrame(frame);
        setTotalFrames(total);
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setIsExporting(false);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Client export error:', err);
      setErrorMessage(err.message || 'Client render failed.');
      setIsExporting(false);
    }
  };

  // Server-Side FFmpeg Queue Export
  const handleServerExport = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setErrorMessage(null);
      setDownloadUrl(null);

      const exportProject = getExportProject();
      const token = getStoredToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('http://localhost:5000/api/v1/renders', {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectData: exportProject })
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const resData = await response.json();
      const jobId = resData.data.id;

      // Connect to WebSocket Telemetry Gateway (Pillar 22)
      const ws = new WebSocket('ws://localhost:5000/ws/render');

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'JOB_PROGRESS' && msg.data.jobId === jobId) {
            setProgress(msg.data.progress);
            setCurrentFrame(msg.data.currentFrame || 0);
            setTotalFrames(msg.data.totalFrames || 0);
          } else if (msg.type === 'JOB_COMPLETED' && msg.data.id === jobId) {
            setProgress(100);
            setIsExporting(false);
            setDownloadUrl(`http://localhost:5000${msg.data.outputUrl}`);
            ws.close();

            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          } else if (msg.type === 'JOB_FAILED' && msg.data.id === jobId) {
            setErrorMessage(msg.data.error || 'Server render failed in FFmpeg queue.');
            setIsExporting(false);
            ws.close();
          }
        } catch (parseErr) {
          console.warn('WS message parse error:', parseErr);
        }
      };

      ws.onerror = () => {
        // Fallback polling if WebSocket fails
        pollServerJob(jobId);
      };
    } catch (err: any) {
      console.error('Server export error:', err);
      setErrorMessage(err.message || 'Could not connect to backend render server.');
      setIsExporting(false);
    }
  };

  const pollServerJob = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/v1/renders/${jobId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setProgress(data.data.progress || 0);
          if (data.data.status === 'completed') {
            clearInterval(interval);
            setIsExporting(false);
            setDownloadUrl(`http://localhost:5000${data.data.outputUrl}`);
            confetti({ particleCount: 80, spread: 60 });
          } else if (data.data.status === 'failed') {
            clearInterval(interval);
            setIsExporting(false);
            setErrorMessage(data.data.error || 'Render failed on server');
          }
        }
      } catch {
        clearInterval(interval);
      }
    }, 1500);
  };

  return (
    <div className="modal-backdrop">
      <div className="vn-export-dialog">
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <Film size={18} className="cyan-icon" />
            <span className="modal-title">Export Project</span>
          </div>
          <button
            onClick={() => {
              if (!isExporting) setShowExportModal(false);
            }}
            className="btn-icon"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="export-tabs">
          <button
            onClick={() => setExportMode('client')}
            className={`export-tab-btn ${exportMode === 'client' ? 'active' : ''}`}
            disabled={isExporting}
          >
            <Zap size={16} />
            <div className="tab-label-group">
              <span className="tab-heading">Instant Local Export</span>
              <span className="tab-sub">WebCodecs (GPU-Accelerated)</span>
            </div>
          </button>

          <button
            onClick={() => setExportMode('server')}
            className={`export-tab-btn ${exportMode === 'server' ? 'active' : ''}`}
            disabled={isExporting}
          >
            <Server size={16} />
            <div className="tab-label-group">
              <span className="tab-heading">BullMQ Distributed Queue</span>
              <span className="tab-sub">Redis Workers & GPU Acceleration</span>
            </div>
          </button>
        </div>

        {/* Export Quality & Resolution Selector (Action Item 1) */}
        <div className="quality-selector-group">
          <div className="selector-subgroup">
            <span className="selector-title">RESOLUTION PRESET</span>
            <div className="pill-buttons">
              <button
                type="button"
                className={`pill-btn ${exportQuality === '720p' ? 'active' : ''}`}
                onClick={() => setExportQuality('720p')}
                disabled={isExporting}
              >
                720p HD
              </button>
              <button
                type="button"
                className={`pill-btn ${exportQuality === '1080p' ? 'active' : ''}`}
                onClick={() => setExportQuality('1080p')}
                disabled={isExporting}
              >
                1080p Full HD
              </button>
              <button
                type="button"
                className={`pill-btn ${exportQuality === '4k' ? 'active' : ''}`}
                onClick={() => setExportQuality('4k')}
                disabled={isExporting}
              >
                4K Ultra HD
              </button>
            </div>
          </div>

          <div className="selector-subgroup">
            <span className="selector-title">FRAMERATE</span>
            <div className="pill-buttons">
              <button
                type="button"
                className={`pill-btn ${exportFps === 30 ? 'active' : ''}`}
                onClick={() => setExportFps(30)}
                disabled={isExporting}
              >
                30 FPS
              </button>
              <button
                type="button"
                className={`pill-btn ${exportFps === 60 ? 'active' : ''}`}
                onClick={() => setExportFps(60)}
                disabled={isExporting}
              >
                60 FPS
              </button>
            </div>
          </div>
        </div>

        {/* Project Summary Specs */}
        <div className="specs-card">
          <div className="spec-item">
            <span className="spec-label">Output Resolution</span>
            <span className="spec-value">{computeDimensions().width} x {computeDimensions().height}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Framerate</span>
            <span className="spec-value">{exportFps} FPS</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Aspect</span>
            <span className="spec-value">{project.canvas.aspectRatio}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label">Duration</span>
            <span className="spec-value">{(project.canvas.durationMs / 1000).toFixed(1)}s</span>
          </div>
        </div>

        {/* Export Progress Bar */}
        {isExporting && (
          <div className="progress-card">
            <div className="progress-status-line">
              <span className="progress-label">
                <Loader2 size={14} className="spin-icon" />
                Rendering frames...
              </span>
              <span className="progress-percent timecode">{progress}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {totalFrames > 0 && (
              <span className="frame-stats timecode">
                Frame {currentFrame} / {totalFrames}
              </span>
            )}
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="error-card">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Download Ready Banner */}
        {downloadUrl && (
          <div className="success-card">
            <CheckCircle2 size={18} className="emerald-icon" />
            <div className="success-info">
              <span className="success-title">Video Rendered Successfully!</span>
              <span className="success-sub">Your master video file is ready to save.</span>
            </div>
            <a
              href={downloadUrl}
              download={`${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`}
              className="btn-primary download-link"
            >
              <Download size={14} />
              <span>Download</span>
            </a>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          <button
            onClick={() => setShowExportModal(false)}
            disabled={isExporting}
            className="btn-secondary"
          >
            Cancel
          </button>

          {!downloadUrl && (
            <button
              onClick={exportMode === 'client' ? handleClientExport : handleServerExport}
              disabled={isExporting}
              className="btn-primary"
            >
              {isExporting ? (
                <>
                  <Loader2 size={14} className="spin-icon" />
                  <span>Rendering...</span>
                </>
              ) : (
                <>
                  <Download size={14} />
                  <span>Start Export</span>
                </>
              )}
            </button>
          )}
        </div>

        <style>{`
          .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(10px);
            z-index: 200;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .vn-export-dialog {
            width: 520px;
            background: var(--bg-surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-medium);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(0, 242, 254, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            gap: 16px;
            padding: 20px;
          }

          .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .modal-title-box {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .cyan-icon {
            color: var(--accent-cyan);
          }

          .modal-title {
            font-size: 16px;
            font-weight: 700;
            color: #FFF;
          }

          .export-tabs {
            display: flex;
            gap: 10px;
          }

          .export-tab-btn {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            border-radius: var(--radius-md);
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            text-align: left;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .export-tab-btn:hover:not(:disabled) {
            border-color: var(--border-strong);
            background: var(--bg-surface-hover);
          }

          .export-tab-btn.active {
            border-color: var(--accent-cyan);
            background: var(--accent-cyan-dim);
            color: var(--accent-cyan);
          }

          .tab-label-group {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .tab-heading {
            font-size: 12px;
            font-weight: 700;
          }

          .quality-selector-group {
            display: flex;
            gap: 16px;
            padding: 10px 14px;
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
          }

          .selector-subgroup {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
          }

          .selector-title {
            font-size: 10px;
            font-weight: 700;
            color: var(--text-muted);
            letter-spacing: 0.5px;
          }

          .pill-buttons {
            display: flex;
            gap: 6px;
          }

          .pill-btn {
            flex: 1;
            padding: 5px 8px;
            font-size: 11px;
            font-weight: 600;
            border-radius: var(--radius-sm);
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
            text-align: center;
          }

          .pill-btn:hover:not(:disabled) {
            color: #FFF;
            background: var(--bg-surface-hover);
            border-color: var(--border-medium);
          }

          .pill-btn.active {
            color: #000;
            background: var(--accent-cyan);
            border-color: var(--accent-cyan);
            font-weight: 700;
            box-shadow: 0 0 10px rgba(0, 242, 254, 0.4);
          }

          .tab-sub {
            font-size: 10px;
            color: var(--text-muted);
          }

          .specs-card {
            display: flex;
            justify-content: space-between;
            padding: 10px 14px;
            background: var(--bg-base);
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-subtle);
          }

          .spec-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .spec-label {
            font-size: 10px;
            color: var(--text-muted);
            text-transform: uppercase;
          }

          .spec-value {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            font-family: var(--font-mono);
          }

          .progress-card {
            background: var(--bg-base);
            padding: 12px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border-subtle);
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .progress-status-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
          }

          .progress-label {
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--text-secondary);
          }

          .spin-icon {
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            100% { transform: rotate(360deg); }
          }

          .progress-percent {
            color: var(--accent-cyan);
            font-weight: 700;
          }

          .progress-track {
            height: 6px;
            background: var(--bg-surface-active);
            border-radius: var(--radius-full);
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent-cyan), #0077FE);
            transition: width 0.15s ease;
          }

          .frame-stats {
            font-size: 10px;
            color: var(--text-muted);
            text-align: right;
          }

          .error-card {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px;
            background: rgba(255, 51, 102, 0.15);
            border: 1px solid rgba(255, 51, 102, 0.3);
            border-radius: var(--radius-sm);
            color: var(--accent-coral);
            font-size: 12px;
          }

          .success-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background: rgba(0, 245, 160, 0.1);
            border: 1px solid rgba(0, 245, 160, 0.3);
            border-radius: var(--radius-md);
          }

          .emerald-icon {
            color: var(--accent-emerald);
          }

          .success-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .success-title {
            font-size: 13px;
            font-weight: 700;
            color: var(--accent-emerald);
          }

          .success-sub {
            font-size: 11px;
            color: var(--text-muted);
          }

          .download-link {
            text-decoration: none;
          }

          .modal-footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 4px;
          }

          .btn-secondary {
            padding: 8px 16px;
            border-radius: var(--radius-md);
            font-size: 13px;
            font-weight: 600;
            color: var(--text-secondary);
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
          }

          .btn-secondary:hover {
            color: #FFF;
            background: var(--bg-surface-hover);
          }
        `}</style>
      </div>
    </div>
  );
};
