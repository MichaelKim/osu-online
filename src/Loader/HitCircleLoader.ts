import * as PIXI from 'pixi.js';
import {
  APPROACH_R,
  getNumberSprites,
  HitObjectTypes,
  initCircleSprite,
  initSprite
} from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample, SampleSetType } from '../SampleSet';
import Skin from '../Skin';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

export interface HitCircleData {
  type: HitObjectTypes.HIT_CIRCLE;

  // Metadata
  position: PIXI.Point;
  t: number;
  hitSound: BaseHitSound;

  // Beatmap
  comboNumber: number;
  comboIndex: number; // Combo color index
  sampleSet: SampleSetType; // Sample set override
  additionSet: SampleSetType;
  stackCount: number;
}

export interface HitCircleSprites {
  circleSprite: PIXI.Container;
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
    position: new PIXI.Point(x, y),
    t,
    hitSound,
    comboNumber,
    comboIndex,
    sampleSet,
    additionSet,
    stackCount: 0
  };
}

export function loadHitCircleSprites(
  object: HitCircleData,
  beatmap: BeatmapData,
  skin: Skin,
  size: number
): HitCircleSprites {
  const comboColors = beatmap.colors.length > 0 ? beatmap.colors : skin.colors;
  const comboColor = comboColors[object.comboIndex % comboColors.length];

  const circleSprite = initCircleSprite(
    skin,
    comboColor,
    object.position,
    size
  );
  const approachSprite = initSprite(
    skin.approach,
    object.position,
    size * APPROACH_R
  );
  const numberSprites = getNumberSprites(
    skin,
    object.comboNumber,
    object.position,
    size
  );

  approachSprite.tint = comboColor;

  return {
    circleSprite,
    approachSprite,
    numberSprites
  };
}
