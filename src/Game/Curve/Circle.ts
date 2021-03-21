import { Point } from '@pixi/math';

const STEP_SEP = 5;

export function getCurve(sliderPoints: Point[], length: number) {
  if (sliderPoints.length !== 3) {
    console.error('Circle curve must have exactly 3 points');
    return [];
  }

  const [start, mid, end] = sliderPoints;

  // Find the circle center
  const mida = midpoint(start, mid);
  const midb = midpoint(end, mid);
  const nora = norm(sub(mid, start));
  const norb = norm(sub(mid, end));
  const circleCenter = intersect(mida, nora, midb, norb);
  if (circleCenter == null) return [];

  // find the angles relative to the circle center
  const startAngPoint = sub(start, circleCenter);
  const midAngPoint = sub(mid, circleCenter);
  const endAngPoint = sub(end, circleCenter);

  let startAng = Math.atan2(startAngPoint.y, startAngPoint.x);
  const midAng = Math.atan2(midAngPoint.y, midAngPoint.x);
  let endAng = Math.atan2(endAngPoint.y, endAngPoint.x);

  const TWO_PI = Math.PI * 2;

  // find the angles that pass through midAng
  if (!isIn(startAng, midAng, endAng)) {
    if (
      Math.abs(startAng + TWO_PI - endAng) < TWO_PI &&
      isIn(startAng + TWO_PI, midAng, endAng)
    )
      startAng += TWO_PI;
    else if (
      Math.abs(startAng - (endAng + TWO_PI)) < TWO_PI &&
      isIn(startAng, midAng, endAng + TWO_PI)
    )
      endAng += TWO_PI;
    else if (
      Math.abs(startAng - TWO_PI - endAng) < TWO_PI &&
      isIn(startAng - TWO_PI, midAng, endAng)
    )
      startAng -= TWO_PI;
    else if (
      Math.abs(startAng - (endAng - TWO_PI)) < TWO_PI &&
      isIn(startAng, midAng, endAng - TWO_PI)
    )
      endAng -= TWO_PI;
    else throw 'Cannot find angles between midAng.';
  }

  // find an angle with an arc length of pixelLength along this circle
  const radius = len(startAngPoint);
  let arcAng = Math.abs(startAng - endAng);
  const expectAng = length / radius;
  if (arcAng > expectAng * 0.97) {
    // console.log("truncating arc to ", expectAng / arcAng);
    arcAng = expectAng; // truncate to given len
  } else {
    console.warn('[curve] P shorter than given', arcAng / expectAng);
  }

  // now use it for our new end angle
  endAng = endAng > startAng ? startAng + arcAng : startAng - arcAng;

  // calculate points
  const step = Math.floor(length / STEP_SEP);
  const curve = [];
  for (let i = 0; i < step + 1; i++) {
    curve.push(pointAt(i / step, startAng, endAng, radius, circleCenter));
  }

  return curve;
}

function midpoint(a: Point, b: Point) {
  return new Point((a.x + b.x) / 2, (a.y + b.y) / 2);
}

function norm(a: Point) {
  return new Point(-a.y, a.x);
}

function sub(a: Point, b: Point) {
  return new Point(a.x - b.x, a.y - b.y);
}

function intersect(a: Point, ta: Point, b: Point, tb: Point) {
  const des = tb.x * ta.y - tb.y * ta.x;
  if (Math.abs(des) < 0.00001) {
    console.warn('[curve] encountering straight P slider');
    return undefined;
  }
  const u = ((b.y - a.y) * ta.x + (a.x - b.x) * ta.y) / des;
  return new Point(b.x + tb.x * u, b.y + tb.y * u);
}

function isIn(a: number, b: number, c: number) {
  return (b > a && b < c) || (b < a && b > c);
}

function len(a: Point) {
  return Math.sqrt(a.x * a.x + a.y * a.y);
}

function pointAt(
  t: number,
  startAng: number,
  endAng: number,
  radius: number,
  circleCenter: Point
) {
  if (t > 1) t = 1;
  const ang = lerp(startAng, endAng, t);
  return new Point(
    Math.cos(ang) * radius + circleCenter.x,
    Math.sin(ang) * radius + circleCenter.y
  );
  //   return {
  //     x: Math.cos(ang) * radius + circleCenter.x,
  //     y: Math.sin(ang) * radius + circleCenter.y,
  //     t: t
  //   };
}

function lerp(a: number, b: number, t: number) {
  return a * (1 - t) + b * t;
}
