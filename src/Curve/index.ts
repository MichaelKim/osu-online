import { getCurve as getCircleCurve } from './Circle';
import { getCurve as getBezierCurve } from './Bezier';

export enum CurveTypes {
  BEZIER = 'B',
  CATMULL = 'C', // centripetal catmull-rom
  LINEAR = 'L',
  PERFECT = 'P' // circle
}

export function getSliderCurve(
  type: CurveTypes,
  points: PIXI.Point[],
  length: number
) {
  if (type === CurveTypes.PERFECT && points.length === 3) {
    return getCircleCurve(points, length);
  } else {
    return getBezierCurve(points, type === CurveTypes.LINEAR, length);
  }
}
