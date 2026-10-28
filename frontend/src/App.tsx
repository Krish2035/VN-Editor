import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { MediaLibrary } from './components/MediaLibrary';
import { PreviewMonitor } from './components/PreviewMonitor';
import { Inspector } from './components/Inspector';
import { Timeline } from './components/Timeline/Timeline';
import { ExportModal } from './components/ExportModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { AuthModal } from './components/AuthModal';
import { ProjectsModal } from './components/ProjectsModal';
import { useEditorStore } from './store/editorStore';
import './styles/theme.css';

export const App: React.FC = () => {
  const { initAuthAndSystem } = useEditorStore();

  useEffect(() => {
    initAuthAndSystem();
  }, [initAuthAndSystem]);

  return (
    <div className="vn-editor-app">
      {/* Top Application Header */}
      <Header />

      {/* Main Studio Middle Section: Library, Monitor, Inspector */}
      <main className="vn-studio-body">
        <MediaLibrary />
        <PreviewMonitor />
        <Inspector />
      </main>

      {/* VN Multi-Track Timeline Engine */}
      <Timeline />

      {/* Export Dialogue */}
      <ExportModal />

      {/* Keyboard Shortcuts Dialogue */}
      <ShortcutsModal />

      {/* Cloud Authentication Dialogue */}
      <AuthModal />

      {/* Cloud Projects (PostgreSQL) Dialogue */}
      <ProjectsModal />

      <style>{`
        .vn-editor-app {
          display: flex;
          flex-direction: column;
          width: 100vw;
          height: 100vh;
          background: var(--bg-canvas);
          color: var(--text-primary);
          overflow: hidden;
        }

        .vn-studio-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default App;
