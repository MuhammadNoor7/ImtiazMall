import React from 'react';
import { useInView } from '../lib/useInView';

/** Wraps a section so it fades/slides up the first time it scrolls into
 * view, with an optional index for a numbered "01 -- Section" editorial
 * label to the side. */
export function Reveal({
  children,
  index,
  className = '',
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={`reveal ${inView ? 'in-view' : ''} ${className}`}>
      {typeof index === 'number' && <span className="section-num">{String(index).padStart(2, '0')}</span>}
      {children}
    </div>
  );
}

export function ScrollProgress() {
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      setPct(scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="scroll-progress">
      <div className="scroll-progress-bar" style={{ width: `${pct}%` }} />
    </div>
  );
}
