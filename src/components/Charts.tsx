import React from 'react';
import { useProgress } from '../lib/useProgress';

const PALETTE = ['#3fd18f', '#ffb74a', '#6d8bff', '#ff6b6b', '#c084fc'];

export function BarChart({
  labels,
  values,
  colors,
  height = 220,
  valueFormatter = (v: number) => v.toFixed(0),
}: {
  labels: string[];
  values: number[];
  colors?: string[];
  height?: number;
  valueFormatter?: (v: number) => string;
}) {
  const progress = useProgress(700, values.join(','));
  const max = Math.max(...values, 1) * 1.15;
  const width = 100;
  const barWidth = width / values.length;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        {values.map((v, i) => {
          const fullHeight = (v / max) * (height - 30);
          const barHeight = fullHeight * progress;
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - 24 - barHeight;
          const color = colors?.[i] ?? PALETTE[i % PALETTE.length];
          return (
            <g key={i}>
              <rect x={x} y={y} width={w} height={barHeight} rx={1.5} fill={color} opacity={0.55 + progress * 0.35} />
              <text x={x + w / 2} y={y - 3} fontSize={4.4} textAnchor="middle" fill="#e9ebf3" opacity={progress}>
                {valueFormatter(v)}
              </text>
              <text x={x + w / 2} y={height - 10} fontSize={3.6} textAnchor="middle" fill="#939aad">
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineChart({
  series,
  height = 220,
}: {
  series: { name: string; color: string; points: { x: number; y: number }[] }[];
  height?: number;
}) {
  const resetKey = series.map((s) => s.points.map((p) => `${p.x}:${p.y}`).join(',')).join('|');
  const progress = useProgress(900, resetKey);
  const width = 100;
  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const allX = series.flatMap((s) => s.points.map((p) => p.x));
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 1) * 1.1;
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const pad = 6;

  const scaleX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2);
  const scaleY = (y: number) => (height - 20) - ((y - minY) / (maxY - minY || 1)) * (height - 40);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <line x1={pad} y1={height - 20} x2={width - pad} y2={height - 20} stroke="#262a3a" strokeWidth={0.3} />
        {series.map((s, si) => {
          const n = s.points.length || 1;
          const path = s.points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
            .join(' ');
          return (
            <g key={si}>
              <path
                d={path}
                fill="none"
                stroke={s.color}
                strokeWidth={0.8}
                pathLength={100}
                strokeDasharray={100}
                strokeDashoffset={100 * (1 - progress)}
              />
              {s.points.map((p, i) => {
                const local = Math.max(0, Math.min(1, progress * n - i));
                return (
                  <circle
                    key={i}
                    cx={scaleX(p.x)}
                    cy={scaleY(p.y) + (1 - local) * 6}
                    r={0.8}
                    fill={s.color}
                    opacity={local}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {series.map((s, i) => (
          <span key={i}>
            <i style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ScatterChart({
  groups,
  height = 260,
  xLabel,
  yLabel,
}: {
  groups: { name: string; color: string; points: { x: number; y: number }[] }[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}) {
  const resetKey = groups.map((g) => g.points.length).join(',');
  const progress = useProgress(800, resetKey);
  const width = 100;
  const allPoints = groups.flatMap((g) => g.points);
  const xs = allPoints.map((p) => p.x);
  const ys = allPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 6;

  const scaleX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (width - pad * 2);
  const scaleY = (y: number) => (height - 20) - ((y - minY) / (maxY - minY || 1)) * (height - 30);
  const totalPoints = allPoints.length || 1;
  let pointCounter = 0;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <line x1={pad} y1={height - 20} x2={width - pad} y2={height - 20} stroke="#262a3a" strokeWidth={0.3} />
        <line x1={pad} y1={10} x2={pad} y2={height - 20} stroke="#262a3a" strokeWidth={0.3} />
        {groups.map((g, gi) =>
          g.points.map((p, i) => {
            const idx = pointCounter++;
            const local = Math.max(0, Math.min(1, progress * totalPoints * 1.3 - idx));
            return (
              <circle
                key={`${gi}-${i}`}
                cx={scaleX(p.x)}
                cy={scaleY(p.y) + (1 - local) * 8}
                r={1.1 * (0.4 + local * 0.6)}
                fill={g.color}
                opacity={0.75 * local}
              />
            );
          }),
        )}
      </svg>
      <div className="chart-legend">
        {groups.map((g, i) => (
          <span key={i}>
            <i style={{ background: g.color }} />
            {g.name}
          </span>
        ))}
        {xLabel && <span>x: {xLabel}</span>}
        {yLabel && <span>y: {yLabel}</span>}
      </div>
    </div>
  );
}

export function Heatmap({
  labels,
  matrix,
  height = 320,
}: {
  labels: string[];
  matrix: number[][];
  height?: number;
}) {
  const resetKey = matrix.length;
  const progress = useProgress(700, resetKey);
  const n = labels.length;
  const cell = 100 / n;

  const colorFor = (v: number) => {
    const t = (v + 1) / 2;
    const r = Math.round(255 - t * (255 - 63));
    const g = Math.round(107 + t * (209 - 107));
    const b = Math.round(107 + t * (143 - 107) * (v > 0 ? 1 : 0.3));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 100 ${height}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet">
        {matrix.map((row, i) =>
          row.map((v, j) => {
            const dist = i + j;
            const local = Math.max(0, Math.min(1, progress * (n * 2) - dist));
            return (
              <g key={`${i}-${j}`}>
                <rect
                  x={j * cell}
                  y={i * (height / n)}
                  width={cell}
                  height={height / n}
                  fill={colorFor(v)}
                  opacity={0.88 * local}
                />
                <text
                  x={j * cell + cell / 2}
                  y={i * (height / n) + height / n / 2 + 3}
                  fontSize={Math.min(3.2, cell * 0.32)}
                  textAnchor="middle"
                  fill="#0a0b10"
                  fontWeight={600}
                  opacity={local}
                >
                  {v.toFixed(2)}
                </text>
              </g>
            );
          }),
        )}
      </svg>
      <div style={{ display: 'flex', marginTop: 8, fontSize: '0.68rem', color: '#939aad', gap: 4, flexWrap: 'wrap' }}>
        {labels.map((l, i) => (
          <span key={i}>{i + 1}. {l}</span>
        ))}
      </div>
    </div>
  );
}

export function Gauge({ value, size = 160 }: { value: number; size?: number }) {
  const progress = useProgress(700, value);
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const animated = value * progress;
  const offset = circumference * (1 - animated);
  const color = value >= 0.5 ? '#3fd18f' : '#ff6b6b';

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#262a3a" strokeWidth={10} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </g>
      </svg>
      <div className="pct">{(animated * 100).toFixed(0)}%</div>
    </div>
  );
}
