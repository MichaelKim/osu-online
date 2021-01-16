import { SampleSetType } from '../SampleSet';
import { parseTimingPoint, TimingPoint } from './TimingPointLoader';

export interface BeatmapData {
  filepath: string; // Path to .osu file
  version: number;

  // [General]
  audioFilename: string;
  audioLeadIn: number;
  sampleSet: SampleSetType;
  stackLeniency: number;

  // [Difficulty]
  cs: number;
  od: number;
  ar: number;
  sliderMultiplier: number;
  sliderTickRate: number;

  // Computed
  timingPoints: TimingPoint[];
}

const DEFAULTS: BeatmapData = {
  version: 14,
  audioLeadIn: 0,
  sampleSet: SampleSetType.NORMAL,
  stackLeniency: 0.7,
  ar: 5,
  sliderMultiplier: 1.4,
  sliderTickRate: 1,
  timingPoints: [],

  filepath: '',
  audioFilename: '',
  cs: 5,
  od: 5
};

type Gen<T> = Generator<T, void, void>;

function* getSections(
  file: string[]
): Gen<[string, () => Generator<string, void, void>]> {
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

function parseKeyValue(line: string): [string, string] {
  const split = line.indexOf(':');
  const key = line.slice(0, split).trim();
  const value = line.slice(split + 1).trim();
  return [key, value];
}

function switchcase<T = string>(cases: Record<string, (value: T) => void>) {
  return (key: string, value: T) => cases[key]?.(value);
}

export function parseBeatmap(file: string[]) {
  const b: BeatmapData = { ...DEFAULTS };

  const parseGeneral = switchcase({
    AudioFilename: value => (b.audioFilename = value),
    AudioLeadIn: value => (b.audioLeadIn = parseInt(value)),
    SampleSet: switchcase<void>({
      Normal: () => (b.sampleSet = SampleSetType.NORMAL),
      Soft: () => (b.sampleSet = SampleSetType.SOFT),
      Drum: () => (b.sampleSet = SampleSetType.DRUM)
    }),
    StackLeniency: value => (b.stackLeniency = parseFloat(value))
  });

  const parseDifficulty = switchcase({
    CircleSize: value => (b.cs = parseFloat(value)),
    OverallDifficulty: value => (b.od = parseFloat(value)),
    ApproachRate: value => (b.ar = parseFloat(value)),
    SliderMultiplier: value => (b.sliderMultiplier = parseFloat(value)),
    SliderTickRate: value => (b.sliderTickRate = parseFloat(value))
  });

  for (const [name, section] of getSections(file)) {
    switch (name) {
      case '[General]': {
        for (const line of section()) {
          const [key, value] = parseKeyValue(line);
          parseGeneral(key, value);
        }
        break;
      }
      case '[Difficulty]': {
        for (const line of section()) {
          const [key, value] = parseKeyValue(line);
          parseDifficulty(key, value);
        }
        break;
      }
      case '[TimingPoints]': {
        for (const line of section()) {
          // TODO: timing point loading should be deferred too?
          const tokens = line.split(',');
          b.timingPoints.push(parseTimingPoint(tokens));
        }
        break;
      }
      case '[HitObjects]': {
        // Parse hit objects later
        for (const _ of section()) {
        }
        break;
      }
    }
  }

  return b;
}
