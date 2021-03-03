import { ILoaderResource, Loader } from '@pixi/loaders';
import { IPointData } from '@pixi/math';
import PIXISound from 'pixi-sound';

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

// lerp val from [0, 5] -> [min, mid] and [5, 10] -> [mid, max]
export function range(val: number, min: number, mid: number, max: number) {
  if (val <= 5) {
    return lerp(val, 0, 5, min, mid);
  }
  return lerp(val, 5, 10, mid, max);
}

export type Tuple<
  T,
  N extends number,
  R extends T[] = []
> = R['length'] extends N ? R : Tuple<T, N, [T, ...R]>;

// If points a and b are within maxDist of each other
export function within(a: IPointData, b: IPointData, maxDist: number) {
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
export function* getSections(file: string[]): Gen<[string, Gen<string>]> {
  for (let i = 0; i < file.length; ) {
    const parseSection = function* () {
      while (i < file.length && file[i][0] !== '[') {
        yield file[i++];
      }
    };
    yield [file[i++], parseSection()];
  }
}

// Parse single section
export function* getSection(file: string[], startSection: string): Gen<string> {
  let i = file.indexOf(startSection) + 1;
  while (i < file.length && file[i][0] !== '[') {
    yield file[i++];
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
  // return PIXI.utils.rgb2hex([r, g, b]);
  return (r << 16) | (g << 8) | b;
}

/* PIXI Specific */

// Adds sound to loader resource (broken in v6.0.0)
export interface LoaderResource extends ILoaderResource {
  sound: PIXISound.Sound;
}

// Loads a PIXI Loader as a promise
export async function loader<K extends string>(
  loader: Loader
): Promise<Partial<Record<K, LoaderResource>>> {
  return new Promise(resolve => loader.load((_, res) => resolve(res)));
}
