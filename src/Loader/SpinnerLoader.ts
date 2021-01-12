import Beatmap from '../Beatmap';
import { HitObjectTypes } from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample } from '../SampleSet';
import { TimingPoint } from './TimingPointLoader';

export interface SpinnerData {
  type: HitObjectTypes.SPINNER;
  t: number;
  hitSound: number;
  endTime: number;
  sampleSet: number;
  additionSet: number;
  rotationsNeeded: number;
}

export function parseSpinner(
  tokens: string[],
  timingPoint: TimingPoint,
  beatmap: Beatmap
): SpinnerData {
  // x,y,time,type,hitSound,endTime,hitSample
  const t = parseInt(tokens[2]);
  const hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;
  const endTime = parseInt(tokens[5]);

  const hitSample = tokens.length > 6 ? parseHitSample(tokens[6]) : [0, 0];
  const sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
  const additionSet = hitSample[1] || sampleSet;

  // Compute required rotations (Taken from opsu)
  const spinsPerMinute = 100 + beatmap.od * 15;
  const rotationsNeeded = (spinsPerMinute * (endTime - t)) / 60000;

  return {
    type: HitObjectTypes.SPINNER,
    t,
    hitSound,
    endTime,
    sampleSet,
    additionSet,
    rotationsNeeded
  };
}
