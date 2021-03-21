import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import {
  APPROACH_R,
  getNumberSprites,
  HitObjectTypes,
  initCircleSprite,
  initSprite,
  STACK_OFFSET_MULT
} from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample, SampleSetType } from '../SampleSet';
import Skin from '../Skin';
import { csToSize } from '../timing';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

export interface HitCircleData {
  type: HitObjectTypes.HIT_CIRCLE;

  // Metadata
  position: Point;
  t: number;
  hitSound: BaseHitSound;

  // Beatmap
  comboNumber: number;
  comboIndex: number; // Combo color index
  sampleSet: SampleSetType; // Sample set override
  additionSet: SampleSetType;
  stackCount: number;

  // Computed
  size: number;
}

export interface HitCircleSprites {
  container: Container;
  circleSprite: Container;
  approachSprite: Sprite;
  numberSprites: Container;
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

  const size = csToSize(beatmap.cs);

  return {
    type: HitObjectTypes.HIT_CIRCLE,
    position: new Point(x, y),
    t,
    hitSound,
    comboNumber,
    comboIndex,
    sampleSet,
    additionSet,
    stackCount: 0,
    size
  };
}

export function loadHitCircleSprites(
  object: HitCircleData,
  beatmap: BeatmapData,
  skin: Skin
): HitCircleSprites {
  const comboColors = beatmap.colors.length > 0 ? beatmap.colors : skin.colors;
  const comboColor = comboColors[object.comboIndex % comboColors.length];

  const circleSprite = initCircleSprite(
    skin,
    comboColor,
    object.position,
    object.size
  );
  const approachSprite = initSprite(
    skin.approach,
    object.position,
    object.size * APPROACH_R
  );
  const numberSprites = getNumberSprites(
    skin,
    object.comboNumber,
    object.position,
    object.size
  );

  approachSprite.tint = comboColor;

  // For convenient alpha, visibility, etc.
  const container = new Container();
  container.visible = false;
  container.addChild(circleSprite, numberSprites, approachSprite);

  // Hit object stacking
  const offset = -(object.stackCount * object.size) / STACK_OFFSET_MULT;
  container.position.set(offset);

  return {
    container,
    circleSprite,
    approachSprite,
    numberSprites
  };
}
