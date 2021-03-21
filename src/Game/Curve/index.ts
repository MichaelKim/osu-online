import { Point } from '@pixi/math';
import { getCurve as getCircleCurve } from './Circle';
import { getCurve as getBezierCurve } from './Bezier';

export enum CurveTypes {
  BEZIER = 'B',
  CATMULL = 'C', // centripetal catmull-rom
  LINEAR = 'L',
  PERFECT = 'P' // circle
}

export interface Line {
  readonly start: Point;
  readonly end: Point;
  readonly offset: Point;
  readonly angle: number;
}

function getCurve(type: CurveTypes, points: Point[], length: number) {
  if (type === CurveTypes.PERFECT && points.length === 3) {
    const circle = getCircleCurve(points, length);

    if (circle.length > 0) return circle;
    // Fallback to bezier
  }

  return getBezierCurve(points, type === CurveTypes.LINEAR, length);
}

export function getSliderCurve(
  type: CurveTypes,
  points: Point[],
  length: number,
  size: number
) {
  const curve = getCurve(type, points, length);

  // Convert curve points to line segments
  const lines: Line[] = [];
  for (let i = 0; i < curve.length - 1; i++) {
    // For each pair of points in the curve
    const p1 = curve[i];
    const p2 = curve[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy);

    // Find the offset tangent to the line segment
    const offset = new Point(
      ((-dy / length) * size) / 2,
      ((dx / length) * size) / 2
    );

    lines.push({
      start: p1,
      end: p2,
      offset,
      angle: Math.atan2(dy, dx)
    });
  }

  return lines;
}

export function pointAt(lines: Line[], t: number) {
  const position = lines.length * t; // [0, 1] => [0, lines.length]
  // Line segment index
  const index = t === 1 ? lines.length - 1 : Math.floor(position); // [0, lines.length - 1]

  // Interpolate point
  const startT = position - index; // [0, 1]
  const point = new Point(
    lines[index].start.x * (1 - startT) + lines[index].end.x * startT,
    lines[index].start.y * (1 - startT) + lines[index].end.y * startT
  );

  return {
    point,
    index
  };
}
