/* Numeric Functions */
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

// If points a and b are within maxDist of each other
export function within(a: PIXI.Point, b: PIXI.Point, maxDist: number) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) < maxDist;
}

/* File Parsing */
// Loads file and splits into line
export async function readFile(filepath: string) {
  const res = await fetch(filepath);
  const text = await res.text();
  return text.split('\n').map(l => l.trim());
}

// Generator that returns sections
type Gen<T> = Generator<T, void, void>;
export function* getSections(file: string[]): Gen<[string, () => Gen<string>]> {
  for (let i = 0; i < file.length; i++) {
    function* parseSection() {
      i++;
      while (i < file.length && file[i][0] !== '[' && file[i].length > 0) {
        yield file[i];
        i++;
      }
    }

    yield [file[i], parseSection];
  }
}

// Parsing "key: value" lines
export function parseKeyValue(line: string): [string, string] {
  const split = line.indexOf(':');
  const key = line.slice(0, split).trim();
  const value = line.slice(split + 1).trim();
  return [key, value];
}

// Parse "r,g,b" colors
export function parseColor(rgb: string) {
  const [r, g, b] = rgb.split(',').map(c => parseInt(c));
  return (r << 16) | (g << 8) | b;
}

/* PIXI Specific */
// Loads a PIXI Loader as a promise
export async function loader<K extends string>(loader: PIXI.Loader) {
  return new Promise<Partial<Record<K, PIXI.LoaderResource>>>(resolve =>
    loader.load((_, res) => resolve(res))
  );
}
