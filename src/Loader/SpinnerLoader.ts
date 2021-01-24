import * as PIXI from 'pixi.js';
import { HitObjectTypes, initSprite } from '../HitObjects';
import { BaseHitSound } from '../HitSoundController';
import { parseHitSample } from '../SampleSet';
import Skin from '../Skin';
import { BeatmapData } from './BeatmapLoader';
import { TimingPoint } from './TimingPointLoader';

export interface SpinnerData {
  position: PIXI.Point;
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
  beatmap: BeatmapData
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
    position: new PIXI.Point(256, 192),
    type: HitObjectTypes.SPINNER,
    t,
    hitSound,
    endTime,
    sampleSet,
    additionSet,
    rotationsNeeded
  };
}

export interface SpinnerSprites {
  container: PIXI.Container;
  bottomSprite: PIXI.Sprite;
  glowSprite: PIXI.Sprite;
  middleSprite: PIXI.Sprite;
  middle2Sprite: PIXI.Sprite;
  topSprite: PIXI.Sprite;
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
  const container = new PIXI.Container();
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
