export function clamp(val: number, min: number, max: number) {
  if (val < min) return min;
  if (val > max) return max;
  return val;
}

// Lerp val from [l1, r1] to [l2, r2]
export function lerp(
  val: number,
  l1: number,
  r1: number,
  l2: number,
  r2: number
) {
  return ((val - l1) * (r2 - l2)) / (r1 - l1) + l2;
}

// Clamp + lerp to [0, 1]
export function clerp01(val: number, left: number, right: number) {
  return clamp(lerp(val, left, right, 0, 1), 0, 1);
}

// Clamp + lerp
export function clerp(
  val: number,
  l1: number,
  r1: number,
  l2: number,
  r2: number
) {
  const l = lerp(val, l1, r1, l2, r2);

  if (l2 < r2) {
    return clamp(l, l2, r2);
  }

  return clamp(l, r2, l2);
}

export type Tuple<
  T,
  N extends number,
  R extends T[] = []
> = R['length'] extends N ? R : Tuple<T, N, [T, ...R]>;

export function distSqr(x1: number, y1: number, x2: number, y2: number) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy;
}

export function parseKeyValue(line: string) {
  const split = line.indexOf(':');
  const key = line.slice(0, split).trim();
  const value = line.slice(split + 1).trim();
  return [key, value];
}
