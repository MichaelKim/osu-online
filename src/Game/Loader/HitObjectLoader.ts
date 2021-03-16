import { HitObject, HitObjectTypes } from '../HitObjects';
import HitCircle from '../HitObjects/HitCircle';
import Slider from '../HitObjects/Slider';
import Spinner from '../HitObjects/Spinner';
import Skin from '../Skin';
import GameState from '../State/GameState';
import { arToMS } from '../timing';
import { getSection, within } from '../util';
import { BeatmapData } from './BeatmapLoader';
import { HitCircleData, parseHitCircle } from './HitCircleLoader';
import { parseSlider, SliderData } from './SliderLoader';
import { parseSpinner, SpinnerData } from './SpinnerLoader';
import { parseTimingPoints, TimingPoint } from './TimingPointLoader';

type HitObjectData = HitCircleData | SliderData | SpinnerData;

function parseHitObjects(
  file: string[],
  beatmap: BeatmapData,
  timingPoints: TimingPoint[]
) {
  let comboNumber = 0;
  let comboIndex = 0;
  let timingIndex = -1;
  let baseBeatLength = 1,
    beatLength = 1;
  const notes: HitObjectData[] = [];

  const section = getSection(file, '[HitObjects]');
  for (const line of section) {
    const tokens = line.split(',');
    if (tokens.length < 4) {
      continue;
    }

    const type = parseInt(tokens[3]);

    // Calculate combo number
    if (type & HitObjectTypes.NEW_COMBO) {
      // New combo
      comboNumber = 1;

      const skip = (type & HitObjectTypes.COMBO_SKIP) >> 4;
      // LAZER: doesn't ignore spinners
      const isSpinner = type & HitObjectTypes.SPINNER;
      comboIndex += skip + (isSpinner ? 0 : 1);
    } else {
      comboNumber++;
    }

    // Update latest point
    const t = parseInt(tokens[2]);
    while (
      timingIndex + 1 < timingPoints.length &&
      timingPoints[timingIndex + 1].time <= t
    ) {
      timingIndex++;
      // Calculate beat length
      if (timingPoints[timingIndex].inherited) {
        beatLength = baseBeatLength * timingPoints[timingIndex].mult;
      } else {
        baseBeatLength = beatLength = timingPoints[timingIndex].beatLength;
      }
    }
    const timingPoint = {
      ...timingPoints[timingIndex],
      beatLength,
      inherited: false
    };

    if (type & HitObjectTypes.HIT_CIRCLE) {
      notes.push(
        parseHitCircle(tokens, comboNumber, comboIndex, timingPoint, beatmap)
      );
    } else if (type & HitObjectTypes.SLIDER) {
      notes.push(
        parseSlider(tokens, comboNumber, comboIndex, timingPoint, beatmap)
      );
    } else if (type & HitObjectTypes.SPINNER) {
      notes.push(parseSpinner(tokens, timingPoint, beatmap));
    }
  }

  return notes;
}

const STACK_LENIENCE = 3;

// Helper methods for stacking
function start(note: HitCircleData | SliderData) {
  if (note.type === HitObjectTypes.HIT_CIRCLE) {
    return note.position;
  }
  return note.lines[0].start;
}

function end(note: SliderData) {
  return note.lines[note.lines.length - 1].end;
}

function endTime(note: HitCircleData | SliderData) {
  if (note.type === HitObjectTypes.HIT_CIRCLE) {
    return note.t;
  }
  return note.endTime;
}

// Taken from https://gist.github.com/peppy/1167470
function calcStacking(beatmap: BeatmapData, notes: HitObjectData[]) {
  const [fadeTime] = arToMS(beatmap.ar);
  // Reverse pass
  for (let i = notes.length - 1; i > 0; i--) {
    let objectI = notes[i];

    // Already done
    if (objectI.type === HitObjectTypes.SPINNER || objectI.stackCount !== 0) {
      continue;
    }

    // Search for any stacking
    for (let n = i - 1; n >= 0; n--) {
      const objectN = notes[n];
      if (objectN.type === HitObjectTypes.SPINNER) {
        continue;
      }

      if (objectI.t - fadeTime * beatmap.stackLeniency > endTime(objectN)) {
        break;
      }

      // Reverse stacking
      if (objectN.type === HitObjectTypes.SLIDER) {
        if (within(end(objectN), start(objectI), STACK_LENIENCE)) {
          const offset = objectI.stackCount - objectN.stackCount + 1;
          for (let j = n + 1; j <= i; j++) {
            const objectJ = notes[j];
            if (
              objectJ.type !== HitObjectTypes.SPINNER &&
              within(end(objectN), start(objectJ), STACK_LENIENCE)
            ) {
              objectJ.stackCount -= offset;
            }
          }
        }
      }

      // Normal stacking
      if (within(start(objectI), start(objectN), STACK_LENIENCE)) {
        objectN.stackCount = objectI.stackCount + 1;
        objectI = objectN;
      }
    }
  }
}

export function loadHitObjects(
  beatmap: BeatmapData,
  skin: Skin,
  gameState: GameState
): HitObject[] {
  const timingPoints = parseTimingPoints(beatmap.file);
  const notes = parseHitObjects(beatmap.file, beatmap, timingPoints);
  calcStacking(beatmap, notes);
  return notes.map(n => {
    switch (n.type) {
      case HitObjectTypes.HIT_CIRCLE:
        return new HitCircle(n, beatmap, skin, gameState);
      case HitObjectTypes.SLIDER:
        return new Slider(n, beatmap, skin, gameState);
      case HitObjectTypes.SPINNER:
        return new Spinner(n, skin, gameState);
    }
  });
}

// Parse only data required for beatmap listing
export function loadHitObjectsData(beatmap: BeatmapData) {
  const notes: {
    type: HitObjectTypes;
    x: number;
    y: number;
    t: number;
  }[] = [];

  const section = getSection(beatmap.file, '[HitObjects]');
  for (const line of section) {
    const tokens = line.split(',');
    if (tokens.length < 4) {
      continue;
    }

    // x,y,time,type,hitSound,objectParams,hitSample
    const x = parseFloat(tokens[0]);
    const y = parseFloat(tokens[1]);
    const t = parseInt(tokens[2]);
    const type = parseInt(tokens[3]);

    if (type & HitObjectTypes.HIT_CIRCLE) {
      notes.push({
        type: HitObjectTypes.HIT_CIRCLE,
        x,
        y,
        t
      });
    } else if (type & HitObjectTypes.SLIDER) {
      notes.push({
        type: HitObjectTypes.SLIDER,
        x,
        y,
        t
      });
    } else if (type & HitObjectTypes.SPINNER) {
      notes.push({
        type: HitObjectTypes.SPINNER,
        x,
        y,
        t
      });
    }
  }

  return notes;
}
