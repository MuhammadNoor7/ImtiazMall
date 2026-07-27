// Small, dependency-free ML primitives that train live in the browser on the
// actual cleaned dataset -- no server, no pre-baked results.

function makeRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const rand = makeRng(seed);
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function trainTestSplit<T>(arr: T[], testRatio: number, seed: number) {
  const shuffled = shuffleWithSeed(arr, seed);
  const testSize = Math.max(1, Math.floor(arr.length * testRatio));
  return { test: shuffled.slice(0, testSize), train: shuffled.slice(testSize) };
}

// ---------------- K-Means ----------------

export interface KMeansResult {
  assignments: number[];
  centroids: number[][];
  iterations: number;
}

function euclidean(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export function standardize(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  const nFeatures = matrix[0].length;
  const means: number[] = [];
  const stds: number[] = [];
  for (let j = 0; j < nFeatures; j++) {
    const col = matrix.map((r) => r[j]);
    const m = col.reduce((a, b) => a + b, 0) / col.length;
    const sd = Math.sqrt(col.reduce((a, b) => a + (b - m) ** 2, 0) / col.length) || 1;
    means.push(m);
    stds.push(sd);
  }
  return matrix.map((row) => row.map((v, j) => (v - means[j]) / stds[j]));
}

export function kmeans(data: number[][], k: number, seed = 42, maxIter = 100): KMeansResult {
  const rand = makeRng(seed);
  const n = data.length;
  const dims = data[0].length;

  const idxs = new Set<number>();
  while (idxs.size < Math.min(k, n)) idxs.add(Math.floor(rand() * n));
  let centroids = Array.from(idxs).map((i) => [...data[i]]);

  let assignments = new Array(n).fill(0);
  let iterations = 0;

  for (let iter = 0; iter < maxIter; iter++) {
    iterations = iter + 1;
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = euclidean(data[i], centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }

    const newCentroids: number[][] = Array.from({ length: centroids.length }, () => new Array(dims).fill(0));
    const counts = new Array(centroids.length).fill(0);
    for (let i = 0; i < n; i++) {
      counts[assignments[i]]++;
      for (let d = 0; d < dims; d++) newCentroids[assignments[i]][d] += data[i][d];
    }
    for (let c = 0; c < centroids.length; c++) {
      if (counts[c] === 0) {
        newCentroids[c] = centroids[c];
        continue;
      }
      for (let d = 0; d < dims; d++) newCentroids[c][d] /= counts[c];
    }
    centroids = newCentroids;
    if (!changed && iter > 0) break;
  }

  return { assignments, centroids, iterations };
}

// ---------------- Decision Tree (CART, Gini) ----------------

export interface TreeNode {
  isLeaf: boolean;
  prediction: number;
  probability: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

function gini(labels: number[]): number {
  const n = labels.length;
  if (n === 0) return 0;
  const p1 = labels.reduce((a, b) => a + b, 0) / n;
  const p0 = 1 - p1;
  return 1 - p0 * p0 - p1 * p1;
}

function bestSplit(X: number[][], y: number[]) {
  let best = { featureIndex: -1, threshold: 0, gain: 0 };
  const n = y.length;
  const baseGini = gini(y);
  const nFeatures = X[0].length;

  for (let f = 0; f < nFeatures; f++) {
    const values = Array.from(new Set(X.map((r) => r[f]))).sort((a, b) => a - b);
    for (let i = 0; i < values.length - 1; i++) {
      const threshold = (values[i] + values[i + 1]) / 2;
      const leftY: number[] = [];
      const rightY: number[] = [];
      for (let j = 0; j < n; j++) {
        if (X[j][f] <= threshold) leftY.push(y[j]);
        else rightY.push(y[j]);
      }
      if (leftY.length === 0 || rightY.length === 0) continue;
      const weighted = (leftY.length / n) * gini(leftY) + (rightY.length / n) * gini(rightY);
      const gain = baseGini - weighted;
      if (gain > best.gain) best = { featureIndex: f, threshold, gain };
    }
  }
  return best;
}

export function trainTree(
  X: number[][],
  y: number[],
  depth = 0,
  maxDepth = 5,
  minSamples = 6,
): TreeNode {
  const n = y.length;
  const p1 = n ? y.reduce((a, b) => a + b, 0) / n : 0;
  const majority = p1 >= 0.5 ? 1 : 0;

  if (depth >= maxDepth || n < minSamples || p1 === 0 || p1 === 1) {
    return { isLeaf: true, prediction: majority, probability: p1 };
  }

  const split = bestSplit(X, y);
  if (split.featureIndex === -1 || split.gain <= 1e-9) {
    return { isLeaf: true, prediction: majority, probability: p1 };
  }

  const leftX: number[][] = [];
  const leftY: number[] = [];
  const rightX: number[][] = [];
  const rightY: number[] = [];
  for (let i = 0; i < n; i++) {
    if (X[i][split.featureIndex] <= split.threshold) {
      leftX.push(X[i]);
      leftY.push(y[i]);
    } else {
      rightX.push(X[i]);
      rightY.push(y[i]);
    }
  }

  return {
    isLeaf: false,
    prediction: majority,
    probability: p1,
    featureIndex: split.featureIndex,
    threshold: split.threshold,
    left: trainTree(leftX, leftY, depth + 1, maxDepth, minSamples),
    right: trainTree(rightX, rightY, depth + 1, maxDepth, minSamples),
  };
}

export function predictTree(node: TreeNode, x: number[]): { prediction: number; probability: number } {
  let cur = node;
  while (!cur.isLeaf && cur.left && cur.right) {
    if (x[cur.featureIndex!] <= cur.threshold!) cur = cur.left;
    else cur = cur.right;
  }
  return { prediction: cur.prediction, probability: cur.probability };
}

export function treeDepth(node: TreeNode): number {
  if (node.isLeaf || !node.left || !node.right) return 1;
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}

// ---------------- Linear Regression (normal equation) ----------------

function transposeMultiply(X: number[][]): number[][] {
  const n = X.length;
  const p = X[0].length;
  const XtX: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    for (let j = 0; j < p; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += X[k][i] * X[k][j];
      XtX[i][j] = s;
    }
  }
  return XtX;
}

function transposeMultiplyVec(X: number[][], y: number[]): number[] {
  const n = X.length;
  const p = X[0].length;
  const Xty = new Array(p).fill(0);
  for (let i = 0; i < p; i++) {
    let s = 0;
    for (let k = 0; k < n; k++) s += X[k][i] * y[k];
    Xty[i] = s;
  }
  return Xty;
}

function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    if (Math.abs(M[i][i]) < 1e-9) M[i][i] = 1e-9;
    for (let k = i + 1; k < n; k++) {
      const factor = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

export interface RegressionResult {
  beta: number[];
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  adjR2: number;
  predict: (row: number[]) => number;
}

export function fitLinearRegression(features: number[][], target: number[]): RegressionResult {
  const n = features.length;
  const Xb = features.map((row) => [1, ...row]);
  const XtX = transposeMultiply(Xb);
  const Xty = transposeMultiplyVec(Xb, target);
  const beta = solveLinearSystem(XtX, Xty);
  const predict = (row: number[]) => beta[0] + row.reduce((s, v, i) => s + v * beta[i + 1], 0);

  const preds = features.map(predict);
  const residuals = target.map((t, i) => t - preds[i]);
  const mae = residuals.reduce((a, b) => a + Math.abs(b), 0) / n;
  const mse = residuals.reduce((a, b) => a + b * b, 0) / n;
  const rmse = Math.sqrt(mse);
  const meanY = target.reduce((a, b) => a + b, 0) / n;
  const ssTot = target.reduce((a, y) => a + (y - meanY) ** 2, 0) || 1;
  const ssRes = residuals.reduce((a, r) => a + r * r, 0);
  const r2 = 1 - ssRes / ssTot;
  const p = features[0].length;
  const adjR2 = n - p - 1 !== 0 ? 1 - ((1 - r2) * (n - 1)) / (n - p - 1) : r2;

  return { beta, mae, mse, rmse, r2, adjR2, predict };
}

// ---------------- Classification metrics ----------------

export interface ClassificationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  confusion: { tp: number; tn: number; fp: number; fn: number };
}

export function evaluateClassifier(actual: number[], predicted: number[]): ClassificationMetrics {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] === 1 && predicted[i] === 1) tp++;
    else if (actual[i] === 0 && predicted[i] === 0) tn++;
    else if (actual[i] === 0 && predicted[i] === 1) fp++;
    else if (actual[i] === 1 && predicted[i] === 0) fn++;
  }
  const accuracy = (tp + tn) / (actual.length || 1);
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  return { accuracy, precision, recall, f1, confusion: { tp, tn, fp, fn } };
}
