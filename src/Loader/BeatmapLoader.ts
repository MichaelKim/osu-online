import { HitObject, HitObjectTypes } from '../HitObjects';
import HitCircle from '../HitObjects/HitCircle';
import Slider from '../HitObjects/Slider';
import HitSoundController from '../HitSoundController';
import { SampleSetType } from '../SampleSet';
import { Skin } from '../Skin';
import { parseTimingPoint, TimingPoint } from './TimingPointLoader';

// export type HitObject = HitCircleData | SliderData | SpinnerData;

export const STACK_LENIENCE_SQR = 3 * 3;

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

export function parseHitObjects(
  file: string[],
  beatmap: BeatmapData,
  skin: Skin,
  hitSoundController: HitSoundController
) {
  let comboNumber = 0;
  let comboIndex = 0;
  let timingIndex = -1;
  let baseBeatLength = 1,
    beatLength = 1;
  const notes: HitObject[] = [];

  for (
    let i = file.indexOf('[HitObjects]') + 1;
    i < file.length && file[i][0] !== '[' && file[i].length > 0;
    i++
  ) {
    const tokens = file[i].split(',');
    if (tokens.length < 4) {
      console.error(`Line ${i} missing tokens`);
      continue;
    }

    const type = parseInt(tokens[3]);

    // Calculate combo number
    if (type & HitObjectTypes.NEW_COMBO) {
      // New combo
      comboNumber = 1;

      const skip = (type & HitObjectTypes.COMBO_SKIP) >> 4;
      comboIndex += skip;
    } else {
      comboNumber++;
    }

    // Update latest point
    const t = parseInt(tokens[2]);
    while (
      timingIndex + 1 < beatmap.timingPoints.length &&
      beatmap.timingPoints[timingIndex + 1].time <= t
    ) {
      timingIndex++;
      // Calculate beat length
      if (beatmap.timingPoints[timingIndex].inherited) {
        beatLength = baseBeatLength * beatmap.timingPoints[timingIndex].mult;
      } else {
        baseBeatLength = beatLength =
          beatmap.timingPoints[timingIndex].beatLength;
      }
    }
    const timingPoint = {
      ...beatmap.timingPoints[timingIndex - 1],
      beatLength,
      inherited: false
    };

    if (type & HitObjectTypes.HIT_CIRCLE) {
      const circle = new HitCircle(
        tokens,
        comboNumber,
        comboIndex,
        beatmap,
        timingPoint,
        skin
      );

      notes.push(circle);
    } else if (type & HitObjectTypes.SLIDER) {
      const slider = new Slider(
        tokens,
        comboNumber,
        comboIndex,
        beatmap,
        timingPoint,
        skin,
        hitSoundController
      );

      notes.push(slider);
    }
  }

  return notes;
}
