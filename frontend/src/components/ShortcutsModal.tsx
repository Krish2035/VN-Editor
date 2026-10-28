import React, { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { Keyboard, X, Command } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { showShortcutsModal, toggleShortcutsModal } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        toggleShortcutsModal();
      } else if (e.key === 'Escape' && showShortcutsModal) {
        toggleShortcutsModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcutsModal, toggleShortcutsModal]);

  if (!showShortcutsModal) return null;

  const shortcutGroups = [
    {
      category: 'Playback & Scrubbing',
      items: [
        { label: 'Play / Pause Video', keys: ['Space', 'or', 'K'] },
        { label: 'Scrub Backward (Rewind)', keys: ['J'] },
        { label: 'Scrub Forward (Fast)', keys: ['L'] },
        { label: 'Step 1 Frame Backward', keys: ['←'] },
        { label: 'Step 1 Frame Forward', keys: ['→'] },
        { label: 'Jump to Start of Project', keys: ['Home'] },
        { label: 'Jump to End of Project', keys: ['End'] }
      ]
    },
    {
      category: 'Timeline & Clip Editing',
      items: [
        { label: 'Razor Split Clip at Playhead', keys: ['Ctrl', '+', 'B'] },
        { label: 'Undo Action', keys: ['Ctrl', '+', 'Z'] },
        { label: 'Redo Action', keys: ['Ctrl', '+', 'Y'] },
        { label: 'Delete Selected Clip', keys: ['Del', 'or', 'Backspace'] },
        { label: 'Add Keyframe Diamond (◆)', keys: ['Ctrl', '+', 'K'] }
      ]
    },
    {
      category: 'Workstation & Toggles',
      items: [
        { label: 'Toggle Keyboard Cheatsheet', keys: ['?'] },
        { label: 'Toggle Safe Margins / Guides', keys: ['G'] },
        { label: 'Close Active Dialogue', keys: ['Esc'] }
      ]
    }
  ];

  return (
    <div className="shortcuts-backdrop" onClick={toggleShortcutsModal}>
      <div className="shortcuts-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="shortcuts-header">
          <div className="title-group">
            <Keyboard size={20} className="cyan-icon" />
            <h3 className="dialog-title">Keyboard Shortcuts</h3>
            <span className="badge badge-cyan">PRO WORKFLOW</span>
          </div>
          <button onClick={toggleShortcutsModal} className="btn-icon">
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="shortcuts-content">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="shortcut-group">
              <span className="group-title">{group.category}</span>
              <div className="shortcut-table">
                {group.items.map((item, idx) => (
                  <div key={idx} className="shortcut-row">
                    <span className="item-label">{item.label}</span>
                    <div className="keys-group">
                      {item.keys.map((k, i) => (
                        k === 'or' || k === '+' ? (
                          <span key={i} className="key-separator">{k}</span>
                        ) : (
                          <kbd key={i} className="kbd-badge">{k}</kbd>
                        )
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shortcuts-footer">
          <span className="hint-text">
            Press <kbd className="kbd-badge-sm">?</kbd> at any time to open this cheat sheet.
          </span>
          <button onClick={toggleShortcutsModal} className="btn-primary-sm">
            Got It
          </button>
        </div>

        <style>{`
          .shortcuts-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.78);
            backdrop-filter: blur(8px);
            z-index: 250;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .shortcuts-dialog {
            width: 580px;
            background: var(--bg-surface);
            border-radius: var(--radius-lg);
            border: 1px solid var(--border-medium);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(0, 242, 254, 0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }

          .shortcuts-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg-surface-elevated);
          }

          .title-group {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .cyan-icon {
            color: var(--accent-cyan);
          }

          .dialog-title {
            font-size: 15px;
            font-weight: 700;
            color: #FFF;
          }

          .shortcuts-content {
            padding: 16px 20px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-height: 480px;
            overflow-y: auto;
          }

          .shortcut-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .group-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .shortcut-table {
            background: var(--bg-surface-elevated);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            overflow: hidden;
          }

          .shortcut-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 7px 12px;
            border-bottom: 1px solid var(--border-subtle);
            font-size: 12px;
          }

          .shortcut-row:last-child {
            border-bottom: none;
          }

          .item-label {
            color: var(--text-secondary);
          }

          .keys-group {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .kbd-badge {
            background: var(--bg-base);
            border: 1px solid var(--border-strong);
            color: var(--accent-cyan);
            font-family: var(--font-mono);
            font-size: 10px;
            font-weight: 700;
            padding: 3px 6px;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
          }

          .kbd-badge-sm {
            background: var(--bg-surface-active);
            border: 1px solid var(--border-strong);
            color: var(--accent-cyan);
            font-family: var(--font-mono);
            font-size: 9px;
            padding: 1px 5px;
            border-radius: 3px;
          }

          .key-separator {
            font-size: 10px;
            color: var(--text-muted);
          }

          .shortcuts-footer {
            padding: 12px 20px;
            background: var(--bg-base);
            border-top: 1px solid var(--border-subtle);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .hint-text {
            font-size: 11px;
            color: var(--text-muted);
          }

          .btn-primary-sm {
            background: var(--accent-cyan);
            color: #000;
            font-weight: 700;
            font-size: 12px;
            padding: 6px 14px;
            border-radius: var(--radius-sm);
            box-shadow: var(--accent-cyan-glow);
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  );
};
