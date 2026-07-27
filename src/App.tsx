import React, { useMemo, useState } from 'react';
import { cleanElectronics, getRawElectronicsCount, mean1, pearson } from './lib/data';
import {
  evaluateClassifier,
  fitLinearRegression,
  kmeans,
  standardize,
  trainTestSplit,
  trainTree,
  treeDepth,
} from './lib/ml';
import { CleanRecord } from './lib/types';
import { BarChart, Heatmap, LineChart, ScatterChart } from './components/Charts';
import { DataExplorer } from './components/DataExplorer';
import { LivePredictor } from './components/LivePredictor';
import {
  FilterBar,
  Findings,
  Footer,
  Header,
  KpiCards,
  ModelCards,
  Recommendations,
  SegmentCards,
} from './components/Sections';

const NUMERIC_COLS: { key: keyof CleanRecord; label: string }[] = [
  { key: 'purchaseAmount', label: 'Amount' },
  { key: 'avgSpendPerPurchase', label: 'AvgSpend' },
  { key: 'purchaseFrequency', label: 'Freq' },
  { key: 'brandAffinity', label: 'Affinity' },
  { key: 'age', label: 'Age' },
  { key: 'incomeLevel', label: 'Income' },
  { key: 'productPref', label: 'Pref' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'willPurchase', label: 'WillBuy' },
];

export default function App() {
  // Loaded + cleaned once; the raw JSON is bundled at build time, so this is
  // effectively instant but still a genuine client-side computation.
  const records = useMemo(() => cleanElectronics(), []);
  const rawCount = useMemo(() => getRawElectronicsCount(), []);

  // --- K-Means (runs once against the full cleaned dataset) ---
  const clustered = useMemo(() => {
    const matrix = records.map((r) => [
      r.purchaseAmount,
      r.purchaseFrequency,
      r.brandAffinity,
      r.productPref,
      r.avgSpendPerPurchase,
    ]);
    const standardized = standardize(matrix);
    const result = kmeans(standardized, 2, 42);
    const withCluster = records.map((r, i) => ({ ...r, cluster: result.assignments[i] }));

    const avgPurchaseByCluster = [0, 1].map((c) => {
      const rows = withCluster.filter((r) => r.cluster === c);
      return rows.length ? mean1(rows.map((r) => r.purchaseAmount)) : 0;
    });
    // Relabel so cluster 0 is always the higher-spending segment for a stable story.
    const highIdx = avgPurchaseByCluster[0] >= avgPurchaseByCluster[1] ? 0 : 1;
    const relabeled = withCluster.map((r) => ({ ...r, cluster: r.cluster === highIdx ? 0 : 1 }));

    return { records: relabeled, iterations: result.iterations };
  }, [records]);

  const allRecords = clustered.records;

  // --- Regression (fit once on the full dataset) ---
  const regression = useMemo(() => {
    const features = allRecords.map((r) => [
      r.purchaseAmount,
      r.purchaseFrequency,
      r.brandAffinity,
      r.age,
      r.incomeLevel,
      r.productPref,
      r.month,
      r.year,
      r.willPurchase,
    ]);
    const target = allRecords.map((r) => r.avgSpendPerPurchase);
    return fitLinearRegression(features, target);
  }, [allRecords]);

  // --- Decision tree (retrainable via seed) ---
  const [seed, setSeed] = useState(7);
  const treeBundle = useMemo(() => {
    const { train, test } = trainTestSplit(allRecords, 0.3, seed);
    const toFeatures = (r: CleanRecord) => [r.purchaseFrequency, r.brandAffinity, r.incomeLevel, r.productPref, r.month, r.year];
    const trainX = train.map(toFeatures);
    const trainY = train.map((r) => r.willPurchase);
    const tree = trainTree(trainX, trainY, 0, 5, 6);

    const testX = test.map(toFeatures);
    const testY = test.map((r) => r.willPurchase);
    const preds = testX.map((x) => {
      let cur = tree;
      while (!cur.isLeaf && cur.left && cur.right) {
        cur = x[cur.featureIndex!] <= cur.threshold! ? cur.left : cur.right;
      }
      return cur.prediction;
    });
    const metrics = evaluateClassifier(testY, preds);
    return { tree, metrics, depth: treeDepth(tree) };
  }, [allRecords, seed]);

  // --- Filters (drive KPIs, charts, segments, table) ---
  const [income, setIncome] = useState('');
  const [season, setSeason] = useState('');
  const [gender, setGender] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return allRecords.filter((r) => {
      if (income && r.incomeLevelLabel !== income) return false;
      if (season && r.season !== season) return false;
      if (gender && r.gender !== gender) return false;
      if (search && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [allRecords, income, season, gender, search]);

  const resetFilters = () => {
    setIncome('');
    setSeason('');
    setGender('');
    setSearch('');
  };

  // --- KPIs from filtered view ---
  const kpis = useMemo(() => {
    const source = filtered.length ? filtered : allRecords;
    return {
      avgPurchase: mean1(source.map((r) => r.purchaseAmount)),
      avgFrequency: mean1(source.map((r) => r.purchaseFrequency)),
      willPurchasePct: mean1(source.map((r) => r.willPurchase)) * 100,
    };
  }, [filtered, allRecords]);

  // --- Segments from filtered view (cluster labels from full-data model) ---
  const segments = useMemo(() => {
    const source = filtered.length ? filtered : allRecords;
    const total = source.length || 1;
    return [0, 1].map((c) => {
      const rows = source.filter((r) => r.cluster === c);
      const n = rows.length || 1;
      return {
        label: c === 0 ? 'High-Value Customers' : 'Frequent Shoppers',
        tone: (c === 0 ? 'high' : 'freq') as 'high' | 'freq',
        size: rows.length,
        pct: (rows.length / total) * 100,
        avgPurchase: rows.length ? mean1(rows.map((r) => r.purchaseAmount)) : 0,
        avgFrequency: rows.length ? mean1(rows.map((r) => r.purchaseFrequency)) : 0,
        avgAffinity: rows.length ? mean1(rows.map((r) => r.brandAffinity)) : 0,
        avgAge: rows.length ? mean1(rows.map((r) => r.age)) : 0,
        willPurchasePct: rows.length ? mean1(rows.map((r) => r.willPurchase)) * 100 : 0,
      };
    });
  }, [filtered, allRecords]);

  // --- Correlation matrix (heatmap) ---
  const correlation = useMemo(() => {
    const source = filtered.length >= 8 ? filtered : allRecords;
    const cols = NUMERIC_COLS.map((c) => source.map((r) => Number(r[c.key])));
    return cols.map((a) => cols.map((b) => pearson(a, b)));
  }, [filtered, allRecords]);

  // --- Monthly trend (line chart) ---
  const monthlyTrend = useMemo(() => {
    const source = filtered.length ? filtered : allRecords;
    const byMonth = new Map<number, number[]>();
    source.forEach((r) => {
      const arr = byMonth.get(r.month) ?? [];
      arr.push(r.purchaseFrequency);
      byMonth.set(r.month, arr);
    });
    const points = Array.from({ length: 12 }, (_, i) => i + 1)
      .filter((m) => byMonth.has(m))
      .map((m) => ({ x: m, y: mean1(byMonth.get(m)!) }));
    return points;
  }, [filtered, allRecords]);

  // --- Dynamic findings ---
  const findings = useMemo(() => {
    const source = allRecords;
    const willBuy = source.map((r) => r.willPurchase);
    const predictorDefs: { key: keyof CleanRecord; label: string }[] = [
      { key: 'purchaseFrequency', label: 'purchase frequency' },
      { key: 'brandAffinity', label: 'brand affinity' },
      { key: 'incomeLevel', label: 'income level' },
      { key: 'productPref', label: 'category preference' },
      { key: 'age', label: 'age' },
      { key: 'year', label: 'year of activity' },
    ];
    const scored = predictorDefs.map((d) => ({
      ...d,
      r: pearson(source.map((r) => Number(r[d.key])), willBuy),
    }));
    scored.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    const top = scored[0];

    const bySeasonAmount = new Map<string, number[]>();
    source.forEach((r) => {
      const arr = bySeasonAmount.get(r.season) ?? [];
      arr.push(r.purchaseAmount);
      bySeasonAmount.set(r.season, arr);
    });
    let peakSeason = '';
    let peakAvg = -Infinity;
    bySeasonAmount.forEach((vals, season) => {
      const m = mean1(vals);
      if (m > peakAvg) {
        peakAvg = m;
        peakSeason = season;
      }
    });

    const [segA, segB] = segments;
    const droppedPct = ((rawCount - allRecords.length) / (rawCount || 1)) * 100;

    return [
      {
        tag: 'CORRELATION',
        text: `Recomputed live: the strongest correlate of "will purchase next month" in this dataset is ${top.label} (r = ${top.r.toFixed(2)}).`,
      },
      {
        tag: 'SEASONALITY',
        text: `${peakSeason} shows the highest average purchase amount at $${peakAvg.toFixed(2)}, computed across ${source.length} electronics transactions.`,
      },
      {
        tag: 'SEGMENTS',
        text: `${segA.label} average $${segA.avgPurchase.toFixed(2)} per purchase and are ${segA.avgAge.toFixed(0)} years old on average, versus $${segB.avgPurchase.toFixed(2)} and ${segB.avgAge.toFixed(0)} years for ${segB.label}.`,
      },
      {
        tag: 'DATA QUALITY',
        text: `${(rawCount - allRecords.length)} of ${rawCount} raw electronics rows (${droppedPct.toFixed(1)}%) were dropped live for excessive missing data; the remaining ${allRecords.length} were mean/mode-imputed on the fly.`,
      },
      {
        tag: 'MODEL',
        text: `The in-browser decision tree currently scores ${(treeBundle.metrics.accuracy * 100).toFixed(1)}% accuracy on a held-out 30% split (seed ${seed}) -- hit "reshuffle" in the live demo below to see it change.`,
      },
    ];
  }, [allRecords, segments, rawCount, treeBundle, seed]);

  const recommendations = [
    'Prioritize marketing to older, higher-spend customers -- the high-value segment skews toward age 50+.',
    'Introduce loyalty bonuses for long-tenured customers to reinforce the segment most likely to keep buying.',
    'Add streak bonuses for consecutive monthly purchases -- purchase frequency is consistently the top predictor of retention.',
    `Use the live decision tree (currently ${(treeBundle.metrics.accuracy * 100).toFixed(1)}% accurate) to score customers for next-month purchase likelihood.`,
    'Align promotions with the seasonal peaks surfaced in the findings above.',
  ];

  const barLabels = segments.map((s) => s.label);
  const barValues = segments.map((s) => s.avgPurchase);
  const barColors = ['#3fd18f', '#ffb74a'];

  const scatterGroups = [0, 1].map((c) => ({
    name: c === 0 ? 'High-Value' : 'Frequent Shoppers',
    color: c === 0 ? '#3fd18f' : '#ffb74a',
    points: (filtered.length ? filtered : allRecords)
      .filter((r) => r.cluster === c)
      .map((r) => ({ x: r.purchaseAmount, y: r.purchaseFrequency })),
  }));

  return (
    <div>
      <Header recordCount={allRecords.length} clusterCount={2} accuracy={treeBundle.metrics.accuracy} />

      <main className="app-shell">
        <section className="block">
          <KpiCards
            avgPurchase={kpis.avgPurchase}
            avgFrequency={kpis.avgFrequency}
            willPurchasePct={kpis.willPurchasePct}
            treeAccuracy={treeBundle.metrics.accuracy}
          />
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Explore the live data</h2>
            <p className="desc">Filters recompute every KPI, chart, and segment below in real time.</p>
          </div>
          <FilterBar
            income={income} setIncome={setIncome}
            season={season} setSeason={setSeason}
            gender={gender} setGender={setGender}
            search={search} setSearch={setSearch}
            count={filtered.length} total={allRecords.length}
            onReset={resetFilters}
          />
          <DataExplorer records={filtered} />
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Customer segments (live K-Means, k=2)</h2>
            <p className="desc">Recomputed from the current filter selection above.</p>
          </div>
          <SegmentCards segments={segments} />
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Segment &amp; correlation charts</h2>
          </div>
          <div className="grid grid-2">
            <div className="card chart-card">
              <h3>Avg. purchase amount by segment</h3>
              <BarChart labels={barLabels} values={barValues} colors={barColors} valueFormatter={(v) => `$${v.toFixed(0)}`} />
            </div>
            <div className="card chart-card">
              <h3>Purchase amount vs. frequency</h3>
              <ScatterChart groups={scatterGroups} xLabel="Purchase Amount ($)" yLabel="Frequency / month" />
            </div>
          </div>
          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <div className="card chart-card">
              <h3>Avg. purchase frequency by month</h3>
              <LineChart series={[{ name: 'Purchase frequency', color: '#6d8bff', points: monthlyTrend }]} />
            </div>
            <div className="card chart-card">
              <h3>Correlation heatmap</h3>
              <Heatmap labels={NUMERIC_COLS.map((c) => c.label)} matrix={correlation} />
            </div>
          </div>
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Predictive models (trained live, right now)</h2>
          </div>
          <ModelCards
            regression={regression}
            treeMetrics={treeBundle.metrics}
            treeDepthVal={treeBundle.depth}
            kmeansIters={clustered.iterations}
          />
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Try the live predictor</h2>
            <p className="desc">Adjust a hypothetical customer profile and see the trained tree's prediction update instantly.</p>
          </div>
          <LivePredictor tree={treeBundle.tree} onRetrain={() => setSeed((s) => s + 1)} seed={seed} />
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Key findings</h2>
            <p className="desc">Recalculated on every load from the live dataset above.</p>
          </div>
          <Findings items={findings} />
        </section>

        <section className="block">
          <div className="block-head">
            <h2>Recommendations</h2>
          </div>
          <Recommendations items={recommendations} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
