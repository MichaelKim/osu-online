import { SampleSetType } from '../SampleSet';
import { getSections, parseColor, parseKeyValue, readFile } from '../util';

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

  // [Colours]
  colors: number[];
}

const DEFAULTS: BeatmapData = {
  version: 14,
  audioLeadIn: 0,
  sampleSet: SampleSetType.NORMAL,
  stackLeniency: 0.7,
  ar: 5,
  sliderMultiplier: 1.4,
  sliderTickRate: 1,
  colors: [],

  filepath: '',
  audioFilename: '',
  cs: 5,
  od: 5
};

// Alternative to switch-case
function switchcase<T = string>(cases: Record<string, (value: T) => void>) {
  return (key: string, value: T) => cases[key]?.(value);
}

export async function parseBeatmap(filepath: string) {
  const file = await readFile(filepath);
  const b: BeatmapData = { ...DEFAULTS, filepath };

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
        for (const line of section) {
          const [key, value] = parseKeyValue(line);
          parseGeneral(key, value);
        }
        break;
      }
      case '[Difficulty]': {
        for (const line of section) {
          const [key, value] = parseKeyValue(line);
          parseDifficulty(key, value);
        }
        break;
      }
      case '[TimingPoints]': {
        // Parse timing points later
        for (const _ of section) {
        }
        break;
      }
      case '[Colours]': {
        for (const line of section) {
          const [key, value] = parseKeyValue(line);
          switch (key) {
            case 'Combo1':
            case 'Combo2':
            case 'Combo3':
            case 'Combo4':
            case 'Combo5':
            case 'Combo6':
            case 'Combo7':
            case 'Combo8':
              b.colors.push(parseColor(value));
              break;
          }
        }
      }
      case '[HitObjects]': {
        // Parse hit objects later
        for (const _ of section) {
        }
        break;
      }
    }
  }

  return b;
}
