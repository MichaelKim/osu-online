import * as PIXI from 'pixi.js';
import { clerp, clerp01, Tuple } from './util';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import {
  APPROACH_R,
  FADE_OUT_MS,
  getNumberSprites,
  initSprite,
  ObjectTypes,
  STACK_OFFSET_MULT
} from './HitObjects';
import { BaseHitSound } from './HitSoundController';
import { SampleSetType } from './SampleSet';
import Beatmap from './Beatmap';
import { TimingPoint } from './Loader/TimingPointLoader';

export default class HitCircle {
  readonly type = ObjectTypes.HIT_CIRCLE;

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
  stackCount: number = 0;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Sprites
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Sprite[];

  // Gameplay
  finished = 0;

  constructor(
    tokens: string[],
    comboNumber: number,
    comboIndex: number,
    beatmap: Beatmap,
    timingPoint: TimingPoint,
    skin: Skin
  ) {
    // x,y,time,type,hitSound,objectParams,hitSample
    this.x = parseFloat(tokens[0]);
    this.y = parseFloat(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;

    // TODO: normalSet:additionSet:index:volume:filename
    let hitSample: Tuple<SampleSetType, 2> = [0, 0];
    if (tokens.length > 6) {
      const sampleTokens = tokens[6].split(':');
      hitSample = [parseInt(sampleTokens[0]), parseInt(sampleTokens[1])];
    }
    this.sampleSet = hitSample[0] || timingPoint.sampleSet || beatmap.sampleSet;
    this.additionSet = hitSample[1] || this.sampleSet;

    this.comboNumber = comboNumber;
    this.comboIndex = comboIndex;

    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(beatmap.ar);
    this.size = csToSize(beatmap.cs);

    // Load sprites
    this.circleSprite = initSprite(skin.circle, this.x, this.y, this.size);
    this.approachSprite = initSprite(
      skin.approach,
      this.x,
      this.y,
      this.size * APPROACH_R
    );
    this.numberSprites = getNumberSprites(
      skin,
      this.comboNumber,
      this.x,
      this.y,
      this.size
    );
  }

  load() {
    // Stack offset
    this.x -= (this.stackCount * this.size) / STACK_OFFSET_MULT;
    this.y -= (this.stackCount * this.size) / STACK_OFFSET_MULT;
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(
      this.circleSprite,
      ...this.numberSprites,
      this.approachSprite
    );
  }

  setVisible(visible: boolean) {
    this.circleSprite.visible = visible;
    this.approachSprite.visible = visible;
    this.numberSprites.forEach(s => (s.visible = visible));
  }

  update(time: number) {
    if (this.finished > 0) {
      // Either hit or missed: Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);

      this.circleSprite.alpha = alpha;
      // TODO: combo numbers disappear instantly
      this.numberSprites.forEach(s => (s.alpha = alpha));
      this.approachSprite.alpha = alpha;
      return time > this.finished + FADE_OUT_MS;
    }

    // Not visible yet
    if (time < this.t - this.fadeTime) {
      return false;
    }

    // Fade in
    if (time < this.t) {
      // TODO: don't update for fully opaque notes
      const alpha = clerp01(
        time,
        this.t - this.fadeTime,
        this.t - this.fullTime
      );

      // Hit circle
      this.circleSprite.alpha = alpha;
      this.approachSprite.alpha = alpha;
      this.numberSprites.forEach(s => (s.alpha = alpha));

      // Update approach circle sizes
      const size =
        this.size * clerp(time, this.t - this.fadeTime, this.t, APPROACH_R, 1);
      this.approachSprite.scale.set(size / this.approachSprite.texture.width);
      return false;
    }

    // Waiting for hit
    this.circleSprite.alpha = 1;
    this.approachSprite.alpha = 1;
    this.numberSprites.forEach(s => (s.alpha = 1));
    this.approachSprite.scale.set(
      this.size / this.approachSprite.texture.width
    );
    return false;
  }

  hit(position: PIXI.Point) {
    const dx = position.x - this.x;
    const dy = position.y - this.y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
