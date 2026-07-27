import React from 'react';
import { ClassificationMetrics, RegressionResult } from '../lib/ml';
import { GENDERS, SEASONS } from '../lib/data';
import { Tilt } from './Tilt';
import { CountUp } from './CountUp';
import { Scene3D } from './Scene3D';

export function Header({ recordCount, clusterCount, accuracy }: { recordCount: number; clusterCount: number; accuracy: number }) {
  return (
    <header className="hero">
      <Scene3D />
      <div className="hero-inner">
        <div className="eyebrow">
          <span className="live-dot" />
          Live &middot; models trained in your browser on load
        </div>
        <h1>Imtiaz Mall Customer Analytics</h1>
        <p className="sub">
          Every number on this page is computed from the real <code>electronics.json</code> dataset the moment it loads &mdash;
          clustering, a decision tree, and a regression model all fit client-side, right now, in TypeScript.
        </p>
        <div className="stat-line">
          <span><b>{recordCount}</b> electronics records</span>
          <span className="dot">&middot;</span>
          <span><b>{clusterCount}</b> live segments</span>
          <span className="dot">&middot;</span>
          <span><b>{(accuracy * 100).toFixed(1)}%</b> decision tree accuracy</span>
        </div>
        <div className="hero-cta">
          <a className="btn-demo" href="#dashboard">Demo</a>
          <a className="btn-github" href="https://github.com/MuhammadNoor7/ImtiazMall" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}

export function KpiCards({
  avgPurchase,
  avgFrequency,
  willPurchasePct,
  treeAccuracy,
}: {
  avgPurchase: number;
  avgFrequency: number;
  willPurchasePct: number;
  treeAccuracy: number;
}) {
  const items = [
    { value: avgPurchase, decimals: 2, prefix: '$', suffix: '', lbl: 'Average purchase amount' },
    { value: avgFrequency, decimals: 2, prefix: '', suffix: '', lbl: 'Avg purchases / month' },
    { value: willPurchasePct, decimals: 1, prefix: '', suffix: '%', lbl: 'Will purchase next month' },
    { value: treeAccuracy * 100, decimals: 1, prefix: '', suffix: '%', lbl: 'Live decision-tree accuracy' },
  ];
  return (
    <div className="grid grid-4 bento">
      {items.map((it, i) => (
        <Tilt className="card kpi" max={6} key={i} style={{ animationDelay: `${i * 60}ms` }}>
          <div className="val">
            <CountUp value={it.value} decimals={it.decimals} prefix={it.prefix} suffix={it.suffix} />
          </div>
          <div className="lbl">{it.lbl}</div>
        </Tilt>
      ))}
    </div>
  );
}

export function FilterBar({
  income, setIncome,
  season, setSeason,
  gender, setGender,
  search, setSearch,
  count, total,
  onReset,
}: {
  income: string; setIncome: (v: string) => void;
  season: string; setSeason: (v: string) => void;
  gender: string; setGender: (v: string) => void;
  search: string; setSearch: (v: string) => void;
  count: number; total: number;
  onReset: () => void;
}) {
  return (
    <div className="filter-bar">
      <select value={income} onChange={(e) => setIncome(e.target.value)}>
        <option value="">All income levels</option>
        <option value="Low">Low income</option>
        <option value="Medium">Medium income</option>
        <option value="High">High income</option>
      </select>
      <select value={season} onChange={(e) => setSeason(e.target.value)}>
        <option value="">All seasons</option>
        {SEASONS.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">All genders</option>
        {GENDERS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
      </select>
      <input
        type="text"
        placeholder="Search transaction ID..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {(income || season || gender || search) && (
        <button className="reset-btn" onClick={onReset}>Reset filters</button>
      )}
      <span className="filter-count">{count} / {total} records match</span>
    </div>
  );
}

export function SegmentCards({
  segments,
}: {
  segments: {
    label: string;
    tone: 'high' | 'freq';
    size: number;
    pct: number;
    avgPurchase: number;
    avgFrequency: number;
    avgAffinity: number;
    avgAge: number;
    willPurchasePct: number;
  }[];
}) {
  return (
    <div className="grid grid-2">
      {segments.map((s, i) => (
        <Tilt className={`card segment ${s.tone}`} max={5} key={i}>
          <span className="tag">Cluster {i} &middot; {s.size} customers ({s.pct.toFixed(0)}%)</span>
          <h3>{s.label}</h3>
          <table>
            <tbody>
              <tr><td>Avg. purchase amount</td><td>${s.avgPurchase.toFixed(2)}</td></tr>
              <tr><td>Avg. purchase frequency / month</td><td>{s.avgFrequency.toFixed(2)}</td></tr>
              <tr><td>Avg. brand affinity (1&ndash;10)</td><td>{s.avgAffinity.toFixed(2)}</td></tr>
              <tr><td>Avg. age</td><td>{s.avgAge.toFixed(1)} yrs</td></tr>
              <tr><td>Will purchase next month</td><td>{s.willPurchasePct.toFixed(1)}%</td></tr>
            </tbody>
          </table>
        </Tilt>
      ))}
    </div>
  );
}

export function ModelCards({
  regression,
  treeMetrics,
  treeDepthVal,
  kmeansIters,
}: {
  regression: RegressionResult;
  treeMetrics: ClassificationMetrics;
  treeDepthVal: number;
  kmeansIters: number;
}) {
  return (
    <div className="grid grid-3">
      <Tilt className="card model bad" max={6}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>A) Linear Regression</h3>
        <div className="score">R&sup2; = {regression.r2.toFixed(4)}</div>
        <p className="note">
          Predicting average spend per purchase from purchase amount, frequency, brand affinity, age,
          income, preference, month and year &mdash; fit live on this data.
        </p>
        <ul>
          <li>Adjusted R&sup2;: {regression.adjR2.toFixed(4)}</li>
          <li>MAE {regression.mae.toFixed(2)} &middot; RMSE {regression.rmse.toFixed(2)}</li>
          <li>Weak fit &mdash; relationships here are non-linear</li>
        </ul>
      </Tilt>
      <Tilt className="card model good" max={6}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>B) Decision Tree</h3>
        <div className="score">{(treeMetrics.accuracy * 100).toFixed(1)}% accuracy</div>
        <p className="note">
          CART classifier (Gini impurity, depth {treeDepthVal}) predicting next-month purchase,
          trained on a live 70/30 split.
        </p>
        <div className="confusion">
          <div>True Positive<b>{treeMetrics.confusion.tp}</b></div>
          <div>True Negative<b>{treeMetrics.confusion.tn}</b></div>
          <div>False Positive<b>{treeMetrics.confusion.fp}</b></div>
          <div>False Negative<b>{treeMetrics.confusion.fn}</b></div>
        </div>
        <ul>
          <li>Precision {(treeMetrics.precision * 100).toFixed(1)}% &middot; Recall {(treeMetrics.recall * 100).toFixed(1)}%</li>
          <li>F1 score {(treeMetrics.f1 * 100).toFixed(1)}%</li>
        </ul>
      </Tilt>
      <Tilt className="card model good" max={6}>
        <h3 style={{ margin: 0, fontSize: '0.95rem' }}>C) K-Means Clustering</h3>
        <div className="score">k = 2</div>
        <p className="note">
          Lloyd's algorithm on standardized features, converged in {kmeansIters} iteration{kmeansIters === 1 ? '' : 's'}.
        </p>
        <ul>
          <li>Features: amount, frequency, affinity, preference, avg spend</li>
          <li>No labels required &mdash; purely unsupervised</li>
          <li>Directly maps to two marketing segments</li>
        </ul>
      </Tilt>
    </div>
  );
}

export function Findings({ items }: { items: { tag: string; text: string }[] }) {
  return (
    <div className="grid grid-auto">
      {items.map((f, i) => (
        <Tilt className="card finding" max={4} key={i}>
          <div className="n">{f.tag}</div>
          <p>{f.text}</p>
        </Tilt>
      ))}
    </div>
  );
}

export function Recommendations({ items }: { items: string[] }) {
  return (
    <ul className="recs">
      {items.map((r, i) => (
        <li key={i}>
          <span className="num">{i + 1}</span>
          <span>{r}</span>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      Computed live from <code>i232536_i232520.ipynb</code> analysis of <code>electronics.json</code> &middot;
      Vite + React + TypeScript, no server, no backend.
    </footer>
  );
}
