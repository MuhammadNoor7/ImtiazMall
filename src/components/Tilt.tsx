import React, { useRef, useState } from 'react';

/** Wraps children in a card that tilts in 3D toward the cursor, with a soft
 * moving glare highlight -- a cheap, dependency-free way to get that
 * "premium product page" feel without a 3D library. */
export function Tilt({
  children,
  className = '',
  max = 8,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  max?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glare, setGlare] = useState<React.CSSProperties>({ opacity: 0 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (py - 0.5) * -max * 2;
    const ry = (px - 0.5) * max * 2;

    setTiltStyle({
      transform: `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`,
      transition: 'transform 0.06s linear',
    });
    setGlare({
      opacity: 1,
      background: `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.10), transparent 60%)`,
    });
  };

  const onLeave = () => {
    setTiltStyle({
      transform: 'perspective(800px) rotateX(0deg) rotateY(0deg) translateZ(0)',
      transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
    });
    setGlare({ opacity: 0, transition: 'opacity 0.4s ease' });
  };

  return (
    <div
      ref={ref}
      className="tilt"
      style={{ ...style, ...tiltStyle }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className={`tilt-body ${className}`}>
        <div className="tilt-glare" style={glare} />
        <div className="tilt-content">{children}</div>
      </div>
    </div>
  );
}
