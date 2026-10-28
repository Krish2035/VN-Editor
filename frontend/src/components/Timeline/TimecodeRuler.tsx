import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';

interface TimecodeRulerProps {
  totalWidthPx: number;
}

export const TimecodeRuler: React.FC<TimecodeRulerProps> = ({ totalWidthPx }) => {
  const rulerRef = useRef<HTMLDivElement | null>(null);
  const { project, pxPerMs, setCurrentTime } = useEditorStore();

  const durationSec = Math.ceil(project.canvas.durationMs / 1000);

  // Interval in seconds between major ticks based on zoom level
  let tickIntervalSec = 2;
  if (pxPerMs > 0.15) tickIntervalSec = 1;
  else if (pxPerMs < 0.04) tickIntervalSec = 5;

  const ticksCount = Math.ceil(durationSec / tickIntervalSec);

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTimeMs = clickX / pxPerMs;
    setCurrentTime(newTimeMs);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div
      ref={rulerRef}
      className="vn-timecode-ruler"
      style={{ width: `${totalWidthPx}px` }}
      onClick={handleRulerClick}
    >
      {Array.from({ length: ticksCount + 1 }).map((_, i) => {
        const sec = i * tickIntervalSec;
        const leftPx = sec * 1000 * pxPerMs;

        return (
          <div key={sec} className="ruler-major-tick" style={{ left: `${leftPx}px` }}>
            <div className="tick-line" />
            <span className="tick-label timecode">{formatSeconds(sec)}</span>
          </div>
        );
      })}

      <style>{`
        .vn-timecode-ruler {
          height: var(--ruler-height);
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
          cursor: pointer;
          user-select: none;
        }

        .ruler-major-tick {
          position: absolute;
          top: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          pointer-events: none;
        }

        .tick-line {
          width: 1px;
          height: 10px;
          background: var(--border-strong);
        }

        .tick-label {
          font-size: 10px;
          color: var(--text-muted);
          padding-left: 4px;
          margin-top: 2px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
