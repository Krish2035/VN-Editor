import React, { useRef } from 'react';
import { useEditorStore } from '../store/editorStore';
import {
  STOCK_VIDEOS,
  STOCK_AUDIO,
  STOCK_SFX,
  TEXT_PRESETS,
  LUT_PRESETS,
  SPEED_CURVE_PRESETS
} from '../core/presets';
import {
  Film,
  Music,
  Type,
  Smile,
  Palette,
  Zap,
  Plus,
  Upload,
  Play
} from 'lucide-react';

export const MediaLibrary: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    activeTab,
    setActiveTab,
    addClipToTrack,
    selectedClipId,
    updateClipColor,
    updateClipSpeedCurve
  } = useEditorStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const isAudio = file.type.startsWith('audio');
    const isVideo = file.type.startsWith('video');

    if (isVideo) {
      // Capture canvas snapshot frame for video thumbnail (Action Item 5)
      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.crossOrigin = 'anonymous';
      tempVideo.muted = true;
      tempVideo.currentTime = 0.5;

      tempVideo.onloadeddata = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = 320;
        offscreen.height = 180;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(tempVideo, 0, 0, 320, 180);
          const durMs = (tempVideo.duration || 10) * 1000;

          addClipToTrack('video', {
            name: file.name,
            assetUrl: url,
            durationMs: Math.min(10000, durMs),
            sourceDurationMs: durMs,
            mimeType: file.type
          });
        }
      };

      tempVideo.onerror = () => {
        addClipToTrack('video', {
          name: file.name,
          assetUrl: url,
          durationMs: 8000,
          sourceDurationMs: 15000,
          mimeType: file.type
        });
      };
    } else {
      const syntheticWave = Array.from({ length: 32 }, (_, i) =>
        Number((0.3 + 0.6 * Math.abs(Math.sin(i * 0.4))).toFixed(2))
      );
      addClipToTrack(isAudio ? 'audio' : 'pip', {
        name: file.name,
        assetUrl: url,
        durationMs: 8000,
        sourceDurationMs: 15000,
        mimeType: file.type,
        waveformData: isAudio ? syntheticWave : undefined
      });
    }
  };

  return (
    <div className="media-library-panel">
      {/* Tab Navigation Icons */}
      <div className="media-tabs-bar">
        <button
          onClick={() => setActiveTab('media')}
          className={`tab-btn ${activeTab === 'media' ? 'active' : ''}`}
          title="Video & Media Assets"
        >
          <Film size={17} />
          <span>Media</span>
        </button>

        <button
          onClick={() => setActiveTab('audio')}
          className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
          title="Music & SFX with Beats"
        >
          <Music size={17} />
          <span>Audio</span>
        </button>

        <button
          onClick={() => setActiveTab('text')}
          className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
          title="Text & Titles"
        >
          <Type size={17} />
          <span>Text</span>
        </button>

        <button
          onClick={() => setActiveTab('luts')}
          className={`tab-btn ${activeTab === 'luts' ? 'active' : ''}`}
          title="Filters & 3D LUTs"
        >
          <Palette size={17} />
          <span>LUTs</span>
        </button>

        <button
          onClick={() => setActiveTab('speed')}
          className={`tab-btn ${activeTab === 'speed' ? 'active' : ''}`}
          title="Speed Curves & Ramping"
        >
          <Zap size={17} />
          <span>Curves</span>
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="tab-content-area">
        {/* MEDIA TAB */}
        {activeTab === 'media' && (
          <div className="tab-pane">
            <div className="upload-header">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="upload-dropzone"
              >
                <Upload size={18} />
                <span>Import Local Media</span>
                <span className="upload-hint">MP4, MOV, WEBM, PNG</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*,image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div className="section-title">Stock Cinematic Clips</div>
            <div className="cards-grid">
              {STOCK_VIDEOS.map((item) => (
                <div key={item.id} className="asset-card">
                  <div className="card-thumb-container">
                    <img src={item.thumbnailUrl} alt={item.title} className="card-thumb" />
                    <span className="card-duration">{item.durationSec}s</span>
                  </div>
                  <div className="card-info">
                    <span className="card-title">{item.title}</span>
                    <button
                      onClick={() =>
                        addClipToTrack('video', {
                          name: item.title,
                          assetUrl: item.url,
                          durationMs: item.durationSec * 1000,
                          sourceDurationMs: item.durationSec * 1000
                        })
                      }
                      className="add-btn"
                      title="Add to Timeline"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIO & SFX TAB */}
        {activeTab === 'audio' && (
          <div className="tab-pane">
            <div className="section-title">Music Tracks (With Beat Detection)</div>
            <div className="audio-list">
              {STOCK_AUDIO.map((audio) => (
                <div key={audio.id} className="audio-item">
                  <div className="audio-meta">
                    <span className="audio-name">{audio.title}</span>
                    <div className="audio-badges">
                      <span className="audio-tag">{audio.category}</span>
                      <span className="beat-badge">⚡ {audio.beats?.length} Beats</span>
                    </div>
                    {/* Audio Waveform Mini Preview (Action Item 5) */}
                    {audio.waveformData && (
                      <div className="audio-mini-waveform">
                        {audio.waveformData.slice(0, 24).map((peak, idx) => (
                          <div
                            key={idx}
                            className="mini-bar"
                            style={{ height: `${Math.max(20, peak * 100)}%` }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      addClipToTrack('audio', {
                        name: audio.title,
                        assetUrl: audio.url,
                        durationMs: audio.durationSec * 1000,
                        sourceDurationMs: audio.durationSec * 1000,
                        beats: audio.beats,
                        waveformData: audio.waveformData
                      })
                    }
                    className="add-btn-circle"
                    title="Add to Timeline"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>Sound Effects (SFX)</div>
            <div className="audio-list">
              {STOCK_SFX.map((sfx) => (
                <div key={sfx.id} className="audio-item">
                  <div className="audio-meta">
                    <span className="audio-name">{sfx.title}</span>
                    <span className="audio-tag">{sfx.category}</span>
                  </div>
                  <button
                    onClick={() =>
                      addClipToTrack('sfx', {
                        name: sfx.title,
                        assetUrl: sfx.url,
                        durationMs: sfx.durationSec * 1000,
                        sourceDurationMs: sfx.durationSec * 1000
                      })
                    }
                    className="add-btn-circle"
                    title="Add to Timeline"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEXT PRESETS TAB */}
        {activeTab === 'text' && (
          <div className="tab-pane">
            <div className="section-title">Kinetic Subtitle & Title Presets</div>
            <div className="text-preset-list">
              {TEXT_PRESETS.map((preset) => (
                <div key={preset.id} className="text-preset-card">
                  <div className="text-preview" style={{ color: preset.color, fontFamily: preset.fontFamily }}>
                    {preset.text}
                  </div>
                  <div className="preset-footer">
                    <span className="preset-name">{preset.name}</span>
                    <button
                      onClick={() =>
                        addClipToTrack('text', {
                          name: preset.name,
                          durationMs: 4000,
                          textData: {
                            text: preset.text,
                            fontSize: preset.fontSize,
                            fontFamily: preset.fontFamily,
                            color: preset.color,
                            align: 'center',
                            animation: preset.animation
                          }
                        })
                      }
                      className="add-btn-pill"
                    >
                      <Plus size={12} />
                      <span>Use Preset</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3D LUTS & FILTERS TAB */}
        {activeTab === 'luts' && (
          <div className="tab-pane">
            <div className="section-title">Cinematic Color Grades & LUTs</div>
            <div className="lut-grid">
              {LUT_PRESETS.map((lut) => (
                <div
                  key={lut.id}
                  className="lut-card"
                  onClick={() => {
                    if (selectedClipId) {
                      updateClipColor(selectedClipId, { lutId: lut.id });
                    }
                  }}
                  title={selectedClipId ? `Apply ${lut.name} to selected clip` : 'Select a clip first'}
                >
                  <div
                    className="lut-swatch"
                    style={{ background: `linear-gradient(135deg, ${lut.previewColor}, #0F131C)` }}
                  />
                  <span className="lut-name">{lut.name}</span>
                  <span className="lut-action">Apply LUT</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SPEED CURVES TAB */}
        {activeTab === 'speed' && (
          <div className="tab-pane">
            <div className="section-title">VN Bezier Speed Curves</div>
            <div className="speed-preset-list">
              {SPEED_CURVE_PRESETS.map((curve) => (
                <div
                  key={curve.id}
                  className="speed-card"
                  onClick={() => {
                    if (selectedClipId) {
                      updateClipSpeedCurve(selectedClipId, curve.points);
                    }
                  }}
                  title={selectedClipId ? `Apply ${curve.name}` : 'Select a clip first'}
                >
                  <div className="speed-curve-visualizer">
                    <svg viewBox="0 0 100 40" className="curve-svg">
                      <path
                        d={`M 0,${35 - curve.points[0][1] * 6} Q 25,${35 - curve.points[1][1] * 6} 50,${35 - curve.points[2][1] * 6} T 100,${35 - curve.points[4][1] * 6}`}
                        fill="none"
                        stroke="#00F2FE"
                        strokeWidth="3"
                      />
                    </svg>
                  </div>
                  <div className="speed-info">
                    <span className="speed-name">{curve.name}</span>
                    <span className="speed-action">Apply Ramp</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .media-library-panel {
          width: 320px;
          height: 100%;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
        }

        .media-tabs-bar {
          display: flex;
          align-items: center;
          padding: 6px;
          background: var(--bg-base);
          border-bottom: 1px solid var(--border-subtle);
          gap: 2px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 6px 2px;
          border-radius: var(--radius-sm);
          font-size: 10px;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.15s ease;
        }

        .tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
        }

        .tab-btn.active {
          color: var(--accent-cyan);
          background: var(--accent-cyan-dim);
        }

        .tab-content-area {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .upload-dropzone {
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-md);
          border: 1px dashed var(--border-strong);
          background: var(--bg-surface-elevated);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: var(--accent-cyan);
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 16px;
        }

        .upload-dropzone:hover {
          border-color: var(--accent-cyan);
          background: var(--accent-cyan-dim);
        }

        .upload-hint {
          font-size: 10px;
          color: var(--text-muted);
        }

        .cards-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .asset-card {
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .asset-card:hover {
          border-color: var(--border-medium);
          transform: translateY(-1px);
        }

        .card-thumb-container {
          position: relative;
          height: 100px;
          background: #000;
        }

        .card-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .card-duration {
          position: absolute;
          bottom: 6px;
          right: 6px;
          background: rgba(0, 0, 0, 0.75);
          font-size: 10px;
          font-family: var(--font-mono);
          padding: 2px 6px;
          border-radius: 3px;
        }

        .card-info {
          padding: 8px 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .add-btn {
          width: 26px;
          height: 26px;
          border-radius: var(--radius-sm);
          background: var(--bg-surface-hover);
          color: var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }

        .add-btn:hover {
          background: var(--accent-cyan);
          color: #000;
        }

        .audio-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .audio-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
        }

        .audio-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .audio-name {
          font-size: 12px;
          font-weight: 600;
        }

        .audio-badges {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .audio-tag {
          font-size: 10px;
          color: var(--text-muted);
        }

        .audio-mini-waveform {
          display: flex;
          align-items: flex-end;
          gap: 2px;
          height: 12px;
          margin-top: 4px;
        }

        .mini-bar {
          flex: 1;
          background: var(--accent-amber);
          border-radius: 1px;
          min-width: 2px;
        }

        .beat-badge {
          font-size: 9px;
          font-weight: 700;
          color: var(--accent-amber);
          background: rgba(255, 179, 0, 0.15);
          padding: 1px 5px;
          border-radius: 3px;
        }

        .add-btn-circle {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: var(--bg-surface-hover);
          color: var(--accent-cyan);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .add-btn-circle:hover {
          background: var(--accent-cyan);
          color: #000;
        }

        .text-preset-card {
          padding: 12px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          margin-bottom: 8px;
        }

        .text-preview {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          text-align: center;
        }

        .preset-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .preset-name {
          font-size: 11px;
          color: var(--text-muted);
        }

        .add-btn-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-cyan);
          background: var(--accent-cyan-dim);
          padding: 3px 8px;
          border-radius: var(--radius-sm);
        }

        .lut-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .lut-card {
          padding: 10px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }

        .lut-card:hover {
          border-color: var(--accent-cyan);
          transform: translateY(-2px);
        }

        .lut-swatch {
          width: 100%;
          height: 38px;
          border-radius: var(--radius-sm);
        }

        .lut-name {
          font-size: 11px;
          font-weight: 600;
          text-align: center;
        }

        .lut-action {
          font-size: 9px;
          color: var(--accent-cyan);
        }

        .speed-preset-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .speed-card {
          padding: 10px;
          background: var(--bg-surface-elevated);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.15s ease;
        }

        .speed-card:hover {
          border-color: var(--accent-cyan);
        }

        .speed-curve-visualizer {
          width: 80px;
          height: 36px;
          background: var(--bg-base);
          border-radius: var(--radius-sm);
          padding: 4px;
        }

        .curve-svg {
          width: 100%;
          height: 100%;
        }

        .speed-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .speed-name {
          font-size: 12px;
          font-weight: 600;
        }

        .speed-action {
          font-size: 10px;
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
};
