import React, { useMemo, useState } from 'react';
import { predictTree, TreeNode } from '../lib/ml';
import { Gauge } from './Charts';
import { ORDINAL_LEVELS } from '../lib/types';

export function LivePredictor({
  tree,
  onRetrain,
  seed,
}: {
  tree: TreeNode;
  onRetrain: () => void;
  seed: number;
}) {
  const [frequency, setFrequency] = useState(5);
  const [affinity, setAffinity] = useState(5);
  const [income, setIncome] = useState('Medium');
  const [pref, setPref] = useState('Medium');
  const [month, setMonth] = useState(6);
  const [year, setYear] = useState(2015);

  const result = useMemo(() => {
    const x = [
      frequency,
      affinity,
      ORDINAL_LEVELS.indexOf(income),
      ORDINAL_LEVELS.indexOf(pref),
      month,
      year,
    ];
    return predictTree(tree, x);
  }, [tree, frequency, affinity, income, pref, month, year]);

  const willBuy = result.prediction === 1;

  return (
    <div className="predictor">
      <div className="card">
        <div className="slider-group">
          <label>Purchase frequency / month <b>{frequency}</b></label>
          <input type="range" min={1} max={10} value={frequency} onChange={(e) => setFrequency(+e.target.value)} />
        </div>
        <div className="slider-group">
          <label>Brand affinity score <b>{affinity}</b></label>
          <input type="range" min={1} max={10} value={affinity} onChange={(e) => setAffinity(+e.target.value)} />
        </div>
        <div className="select-row">
          <div>
            <label>Income level</label>
            <select value={income} onChange={(e) => setIncome(e.target.value)}>
              {ORDINAL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label>Category preference</label>
            <select value={pref} onChange={(e) => setPref(e.target.value)}>
              {ORDINAL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="slider-group">
          <label>Month <b>{month}</b></label>
          <input type="range" min={1} max={12} value={month} onChange={(e) => setMonth(+e.target.value)} />
        </div>
        <div className="slider-group">
          <label>Year of activity <b>{year}</b></label>
          <input type="range" min={1970} max={2023} value={year} onChange={(e) => setYear(+e.target.value)} />
        </div>
        <button className="retrain-btn" onClick={onRetrain}>Reshuffle &amp; retrain live (seed {seed})</button>
        <p className="seed-note">Retrains the decision tree on a fresh random 70/30 split of the real dataset, right here in your browser.</p>
      </div>
      <div className={`predict-result ${willBuy ? 'yes' : 'no'}`}>
        <Gauge value={result.probability} />
        <div className="verdict">{willBuy ? 'Will purchase next month' : 'Unlikely to purchase next month'}</div>
        <p style={{ color: '#939aad', fontSize: '0.85rem', maxWidth: 260 }}>
          Confidence from the live-trained decision tree leaf covering this customer profile.
        </p>
      </div>
    </div>
  );
}
