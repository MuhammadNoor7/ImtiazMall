import React from 'react';
import { ClassificationMetrics, RegressionResult } from '../lib/ml';
import { GENDERS, SEASONS } from '../lib/data';

export function Header({ recordCount, clusterCount, accuracy }: { recordCount: number; clusterCount: number; accuracy: number }) {
  return (
    <header className="hero">
      <div className="eyebrow">
        <span className="live-dot" />
        Live &middot; models trained in your browser on load
      </div>
      <h1>Imtiaz Mall Customer Analytics</h1>
      <p className="sub">
        Every number on this page is computed from the real <code>electronics.json</code> dataset the moment it loads &mdash;
        clustering, a decision tree, and a regression model all fit client-side, right now, in TypeScript.
      </p>
      <div className="badges">
        <span className="badge"><b>{recordCount}</b>&nbsp;electronics records</span>
        <span className="badge"><b>{clusterCount}</b>&nbsp;live segments</span>
        <span className="badge"><b>{(accuracy * 100).toFixed(1)}%</b>&nbsp;decision tree accuracy</span>
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
    { val: `$${avgPurchase.toFixed(2)}`, lbl: 'Average purchase amount' },
    { val: avgFrequency.toFixed(2), lbl: 'Avg purchases / month' },
    { val: `${willPurchasePct.toFixed(1)}%`, lbl: 'Will purchase next month' },
    { val: `${(treeAccuracy * 100).toFixed(1)}%`, lbl: 'Live decision-tree accuracy' },
  ];
  return (
    <div className="grid grid-4">
      {items.map((it, i) => (
        <div className="card kpi" key={i}>
          <div className="val">{it.val}</div>
          <div className="lbl">{it.lbl}</div>
        </div>
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
        <div className={`card segment ${s.tone}`} key={i}>
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
        </div>
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
      <div className="card model bad">
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
      </div>
      <div className="card model good">
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
      </div>
      <div className="card model good">
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
      </div>
    </div>
  );
}

export function Findings({ items }: { items: { tag: string; text: string }[] }) {
  return (
    <div className="grid grid-auto">
      {items.map((f, i) => (
        <div className="card finding" key={i}>
          <div className="n">{f.tag}</div>
          <p>{f.text}</p>
        </div>
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
