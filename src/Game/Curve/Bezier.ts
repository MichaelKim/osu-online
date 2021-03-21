import { Point } from '@pixi/math';

interface Bezier {
  // Calculated points along the curve
  curve: Point[];
  // Pairwise distance (i: i-1 to i)
  curveDist: number[];
  // Total distance (arc length) of this curve
  totalDist: number;
}

// Calculate approximate (arc) length
function calcLength(points: Point[]) {
  let approxLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i].x - points[i + 1].x;
    const dy = points[i].y - points[i + 1].y;
    approxLength += Math.hypot(dx, dy);
  }
  return approxLength;
}

// Create curve section
function createBezier(points: Point[]): Bezier {
  const approxLength = calcLength(points);

  // Subdivide curve
  const ncurve = Math.floor(approxLength / 4) + 2; // Number of points on curve section
  const curve: Point[] = [];
  for (let i = 0; i < ncurve; i++) {
    curve.push(pointAt(points, i / (ncurve - 1)));
  }

  const curveDist: number[] = []; // Pairwise distance (i: i-1 to i)
  let totalDist = 0;
  for (let i = 0; i < ncurve; i++) {
    if (i === 0) curveDist.push(0);
    else {
      const dx = curve[i].x - curve[i - 1].x;
      const dy = curve[i].y - curve[i - 1].y;
      curveDist.push(Math.hypot(dx, dy));
      totalDist += curveDist[i];
    }
  }

  return {
    curve,
    curveDist,
    totalDist
  };
}

// Split slider into several curve sections
// Red control points are in sliderPoints twice
function splitSlider(sliderPoints: Point[], linear: boolean) {
  const beziers: Bezier[] = [];
  let points: Point[] = [];
  let lastPoi: Point | null = null;

  for (const tpoi of sliderPoints) {
    if (linear) {
      // Linear: create pairwise sections
      if (lastPoi != null) {
        points.push(tpoi);
        beziers.push(createBezier(points));
        points = [];
      }
    } else if (lastPoi != null && tpoi.equals(lastPoi)) {
      // Red point: create new bezier section
      if (points.length >= 2) {
        beziers.push(createBezier(points));
      }
      points = [];
    }
    points.push(tpoi);
    lastPoi = tpoi;
  }

  // Remaining points
  if (!linear && points.length >= 2) {
    beziers.push(createBezier(points));
  }

  return beziers;
}

// Get equidistant points along slider
export function getCurve(
  sliderPoints: Point[],
  linear: boolean,
  length: number
) {
  const beziers = splitSlider(sliderPoints, linear);

  // init equidistance
  // Points generated along the curve should be spaced this far apart.
  const ncurve = Math.floor(length / 5);
  const curve: Point[] = [];

  let distanceAt = 0; // accumulated length of new curve
  let curPoint = 0;
  let curCurveIndex = 0;
  let curCurve = beziers[0]; // current pointer of raw curve array
  let lastCurve = curCurve.curve[0];
  let lastDistanceAt = 0;

  for (let i = 0; i < ncurve + 1; i++) {
    const prefDist = Math.floor((i * length) / ncurve); // Expected total length so far
    while (distanceAt < prefDist) {
      lastDistanceAt = distanceAt;
      lastCurve = curCurve.curve[curPoint];
      curPoint++;

      // Get next curve
      if (curPoint >= curCurve.curve.length) {
        if (curCurveIndex < beziers.length - 1) {
          curCurveIndex++;
          curCurve = beziers[curCurveIndex];
          curPoint = 0;
        } else {
          // No more curves left
          curPoint = curCurve.curve.length - 1;
          if (lastDistanceAt === distanceAt) {
            if (distanceAt < length * 0.97) {
              console.warn(
                '[curve] L/B shorter than given',
                distanceAt / length
              );
            }
            // out of points even though the preferred distance hasn't been reached
            break;
          }
        }
      }
      distanceAt += curCurve.curveDist[curPoint];
    }

    // Distance reached
    const thisCurve = curCurve.curve[curPoint];
    // lerp between lastCurve and thisCurve
    if (lastCurve == thisCurve) {
      curve[i] = thisCurve;
    } else {
      const t = (prefDist - lastDistanceAt) / (distanceAt - lastDistanceAt);
      curve[i] = new Point(
        lerp01(lastCurve.x, thisCurve.x, t),
        lerp01(lastCurve.y, thisCurve.y, t)
      );
    }
  }

  return curve;
}

function lerp01(a: number, b: number, t: number) {
  // lerp t from [0, 1] to [a, b]
  // lerp(0, 1, a, b, t)
  return a * (1 - t) + b * t;
}

function binomialCoefficient(n: number, k: number) {
  if (k < 0 || k > n) {
    return 0;
  }
  if (k == 0 || k == n) {
    return 1;
  }
  const k2 = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k2; i++) {
    c *= (n - i) / (i + 1);
  }
  return c;
}

// Calculates the Bernstein polynomial.
function bernstein(i: number, n: number, t: number) {
  return binomialCoefficient(n, i) * Math.pow(t, i) * Math.pow(1 - t, n - i);
}

function pointAt(points: Point[], t: number) {
  const c = new Point(0, 0);
  const n = points.length - 1; // Degree (?)
  for (let i = 0; i < points.length; i++) {
    const b = bernstein(i, n, t);
    c.x += points[i].x * b;
    c.y += points[i].y * b;
  }
  return c;
}
