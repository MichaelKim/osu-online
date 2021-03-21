import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { HitObjectTypes, initSprite } from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample } from '../SampleSet';
import Skin from '../Skin';
import { range } from '../util';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

export interface SpinnerData {
  position: Point;
  type: HitObjectTypes.SPINNER;
  t: number;
  hitSound: number;
  endTime: number;
  sampleSet: number;
  additionSet: number;
  rotationsNeeded: number;
  maxBonusSpins: number;
}

// 480rpm (osu!lazer) ~ 477rpm (osu!stable)
const MAX_ROTATIONS_PER_SEC = 8;
// lazer to stable adjustment factor
const STABLE_ADJUST = 0.6;

export function parseSpinner(
  tokens: string[],
  timingPoint: TimingPoint,
  beatmap: BeatmapData
): SpinnerData {
  // x,y,time,type,hitSound,endTime,hitSample
  const t = parseInt(tokens[2]);
  const hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;
  const endTime = parseInt(tokens[5]);

  const hitSample = tokens.length > 6 ? parseHitSample(tokens[6]) : [0, 0];
  const sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
  const additionSet = hitSample[1] || sampleSet;

  // Compute required rotations
  const duration = (endTime - t) / 1000; // In seconds
  const minRotationsPerSec = STABLE_ADJUST * range(beatmap.od, 3, 5, 7.5);
  const rotationsNeeded = Math.floor(duration * minRotationsPerSec);
  const maxBonusSpins = Math.floor(
    (MAX_ROTATIONS_PER_SEC - minRotationsPerSec) * duration
  );

  return {
    position: new Point(256, 192),
    type: HitObjectTypes.SPINNER,
    t,
    hitSound,
    endTime,
    sampleSet,
    additionSet,
    rotationsNeeded,
    maxBonusSpins
  };
}

export interface SpinnerSprites {
  container: Container;
  bottomSprite: Sprite;
  glowSprite: Sprite;
  middleSprite: Sprite;
  middle2Sprite: Sprite;
  topSprite: Sprite;
}

export function loadSpinnerSprites(
  object: SpinnerData,
  skin: Skin
): SpinnerSprites {
  const bottomSprite = initSprite(skin.spinnerBottom);
  const glowSprite = initSprite(skin.spinnerGlow);
  const middleSprite = initSprite(skin.spinnerMiddle);
  const middle2Sprite = initSprite(skin.spinnerMiddle2);
  const topSprite = initSprite(skin.spinnerTop);

  bottomSprite.scale.set(0.5);
  glowSprite.scale.set(0.5);
  middleSprite.scale.set(0.5);
  middle2Sprite.scale.set(0.5);
  topSprite.scale.set(0.5);

  // For convenient alpha, visibility, etc.
  const container = new Container();
  container.visible = false;
  container.position.copyFrom(object.position);
  container.addChild(
    glowSprite,
    bottomSprite,
    topSprite,
    middle2Sprite,
    middleSprite
  );

  return {
    container,
    bottomSprite,
    glowSprite,
    middleSprite,
    middle2Sprite,
    topSprite
  };
}
