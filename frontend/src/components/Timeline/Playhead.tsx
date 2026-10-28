import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';

export const Playhead: React.FC = () => {
  const { currentTimeMs, pxPerMs, setCurrentTime } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);

  const leftPx = currentTimeMs * pxPerMs;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startTimeMs = currentTimeMs;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaPx = moveEvent.clientX - startX;
      setCurrentTime(startTimeMs + deltaPx / pxPerMs);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      className={`vn-playhead ${isDragging ? 'dragging' : ''}`}
      style={{ transform: `translateX(${leftPx}px)` }}
      onMouseDown={handleMouseDown}
    >
      {/* Top Handle Needle */}
      <div className="playhead-handle">
        <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
          <path
            d="M1 1 H13 V11 L7 17 L1 11 Z"
            fill="#00F2FE"
            stroke="#00F2FE"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Vertical Cyan Laser Line */}
      <div className="playhead-line" />

      <style>{`
        .vn-playhead {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 0px;
          z-index: 50;
          pointer-events: auto;
          cursor: ew-resize;
        }

        .playhead-handle {
          position: absolute;
          top: 2px;
          left: -7px;
          cursor: grab;
          filter: drop-shadow(0 0 8px rgba(0, 242, 254, 0.6));
          transition: transform 0.1s ease;
        }

        .playhead-handle:hover {
          transform: scale(1.15);
        }

        .vn-playhead.dragging .playhead-handle {
          cursor: grabbing;
          transform: scale(1.2);
        }

        .playhead-line {
          position: absolute;
          top: 18px;
          bottom: 0;
          left: -1px;
          width: 2px;
          background: #00F2FE;
          box-shadow: 0 0 10px rgba(0, 242, 254, 0.8), 0 0 2px #FFF;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
