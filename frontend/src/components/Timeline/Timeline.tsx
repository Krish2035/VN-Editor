import React from 'react';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineTracks } from './TimelineTracks';

export const Timeline: React.FC = () => {
  return (
    <section className="vn-timeline-wrapper">
      <TimelineToolbar />
      <TimelineTracks />

      <style>{`
        .vn-timeline-wrapper {
          height: 310px;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
          border-top: 1px solid var(--border-subtle);
          position: relative;
          z-index: 10;
        }
      `}</style>
    </section>
  );
};
