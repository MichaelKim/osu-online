import { SampleSetType } from '../SampleSet';
import { clamp, getSection } from '../util';

enum Effects {
  KIAI = 1 << 0
  // OMIT_FIRST = 1 << 3
}

export interface TimingPoint {
  time: number;
  beatLength: number;
  meter: number;
  sampleSet: 0 | SampleSetType; // 0: beatmap default
  sampleIndex: number; // TODO: what is this
  volume: number;
  inherited: boolean;
  kiai: boolean;
  mult: number; // inverse slider velocity multiplier
}

export function parseTimingPoints(file: string[]) {
  const timingPoints: TimingPoint[] = [];

  const section = getSection(file, '[TimingPoints]');
  for (const line of section) {
    const tokens = line.split(',');

    const time = parseFloat(tokens[0]);
    const meter = parseInt(tokens[2]);
    const sampleSet = parseInt(tokens[3]);
    const sampleIndex = parseInt(tokens[4]);
    const volume = parseInt(tokens[5]);
    // this.inherited = parseInt(tokens[6]);
    let kiai = false;
    if (tokens.length > 7) {
      const effects = parseInt(tokens[7]);
      kiai = (effects & Effects.KIAI) > 0;
    }

    // tokens[1] is either beatLength (positive) or velocity (negative)
    const beatLength = parseFloat(tokens[1]);
    const inherited = beatLength <= 0;
    const mult = inherited ? clamp(-beatLength, 10, 1000) / 100 : 1;

    timingPoints.push({
      time,
      beatLength,
      meter,
      sampleSet,
      sampleIndex,
      volume,
      inherited,
      kiai,
      mult
    });
  }

  return timingPoints;
}

// TODO: not being used?
export function normalize(points: TimingPoint[]) {
  // Convert all timing points into uninherited ones
  const normPoints = [];
  let beatLength = 1,
    baseBeatLength = 1;
  for (const p of points) {
    if (p.inherited) {
      beatLength = baseBeatLength * p.mult;
    } else {
      baseBeatLength = beatLength = p.beatLength;
    }
    normPoints.push({
      ...p,
      inherited: false,
      beatLength
    });
  }
  return normPoints;
}
