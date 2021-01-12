import {
  APPROACH_R,
  getNumberSprites,
  HitObjectTypes,
  initSprite
} from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample, SampleSetType } from '../SampleSet';
import { Skin } from '../Skin';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

// TODO: combine x,y into position?
export interface HitCircleData {
  type: HitObjectTypes.HIT_CIRCLE;

  // Metadata
  x: number;
  y: number;
  t: number;
  hitSound: BaseHitSound;

  // Beatmap
  comboIndex: number; // Combo color index
  comboNumber: number;
  sampleSet: SampleSetType; // Sample set override
  additionSet: SampleSetType;
}

export interface HitCircleSprites {
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Container;
}

// Everything that can be determined with a single pass
// through a beatmap's notes (so everything except stacking)
export function parseHitCircle(
  tokens: string[],
  comboNumber: number,
  comboIndex: number,
  timingPoint: TimingPoint,
  beatmap: BeatmapData
): HitCircleData {
  // x,y,time,type,hitSound,objectParams,hitSample
  const x = parseFloat(tokens[0]);
  const y = parseFloat(tokens[1]);
  const t = parseInt(tokens[2]);
  const hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;

  const hitSample = tokens.length > 10 ? parseHitSample(tokens[10]) : [0, 0];
  const sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
  const additionSet = hitSample[1] || sampleSet;

  return {
    type: HitObjectTypes.HIT_CIRCLE,
    x,
    y,
    t,
    hitSound,
    comboIndex,
    comboNumber,
    sampleSet,
    additionSet
  };
}

export function loadHitCircleSprites(
  object: HitCircleData,
  skin: Skin,
  size: number
): HitCircleSprites {
  const circleSprite = initSprite(skin.circle, object.x, object.y, size);
  const approachSprite = initSprite(
    skin.approach,
    object.x,
    object.y,
    size * APPROACH_R
  );
  const numberSprites = getNumberSprites(
    skin,
    object.comboNumber,
    object.x,
    object.y,
    size
  );

  return {
    circleSprite,
    approachSprite,
    numberSprites
  };
}
