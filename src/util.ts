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

export function within(a: PIXI.Point, b: PIXI.Point, maxDist: number) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < maxDist;
}

export function parseKeyValue(line: string) {
  const split = line.indexOf(':');
  const key = line.slice(0, split).trim();
  const value = line.slice(split + 1).trim();
  return [key, value];
}

export async function readFile(filepath: string) {
  const res = await fetch(filepath);
  const text = await res.text();
  return text.split('\n').map(l => l.trim());
}

export async function loader<K extends string>(loader: PIXI.Loader) {
  return new Promise<Partial<Record<K, PIXI.LoaderResource>>>(resolve =>
    loader.load((_, res) => resolve(res))
  );
}
