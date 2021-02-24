import { SampleSetType } from '../SampleSet';
import { getSections, parseColor, parseKeyValue } from '../util';

enum GameMode {
  STANDARD = 0,
  // Unsupported
  TAIKO = 1,
  CATCH = 2,
  MANIA = 3
}

export interface BeatmapData {
  file: string[]; // Contents of .osu file
  formatVersion: number;

  // [General]
  audioFilename: string;
  audioLeadIn: number;
  sampleSet: SampleSetType;
  stackLeniency: number;
  mode: number;

  // [Metadata]
  title: string;
  artist: string;
  creator: string;
  version: string;
  beatmapID: number; // Old versions don't have this ID

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
  formatVersion: 14,
  audioLeadIn: 0,
  sampleSet: SampleSetType.NORMAL,
  stackLeniency: 0.7,
  ar: 5,
  sliderMultiplier: 1.4,
  sliderTickRate: 1,
  colors: [],
  mode: GameMode.STANDARD,
  title: '',
  artist: '',
  creator: '',
  version: '',
  beatmapID: 0,
  file: [],
  audioFilename: '',
  cs: 5,
  od: 5
};

// Alternative to switch-case
function switchcase<T = string>(cases: Record<string, (value: T) => void>) {
  return (key: string, value: T) => cases[key]?.(value);
}

export function parseBeatmap(file: string[]) {
  const b: BeatmapData = { ...DEFAULTS, file };

  const parseGeneral = switchcase({
    AudioFilename: value => (b.audioFilename = value),
    AudioLeadIn: value => (b.audioLeadIn = parseInt(value)),
    SampleSet: switchcase<void>({
      Normal: () => (b.sampleSet = SampleSetType.NORMAL),
      Soft: () => (b.sampleSet = SampleSetType.SOFT),
      Drum: () => (b.sampleSet = SampleSetType.DRUM)
    }),
    StackLeniency: value => (b.stackLeniency = parseFloat(value)),
    Mode: value => (b.mode = parseInt(value))
  });

  const parseMetadata = switchcase({
    Title: value => (b.title = value),
    Artist: value => (b.artist = value),
    Creator: value => (b.creator = value),
    Version: value => (b.version = value),
    BeatmapID: value => (b.beatmapID = parseInt(value))
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
      case '[Metadata]': {
        for (const line of section) {
          const [key, value] = parseKeyValue(line);
          parseMetadata(key, value);
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
        while (!section.next().done);
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
        break;
      }
      case '[HitObjects]': {
        // Parse hit objects later
        while (!section.next().done);
        break;
      }
    }
  }

  return b;
}
