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
import { parseHitSample, SampleSetType } from './SampleSet';
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

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Sprites
  container: PIXI.Container;
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

    const hitSample = tokens.length > 10 ? parseHitSample(tokens[10]) : [0, 0];
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

    this.container = new PIXI.Container();
    this.container.visible = false;
    this.container.addChild(
      this.circleSprite,
      ...this.numberSprites,
      this.approachSprite
    );
  }

  set stackCount(stack: number) {
    // Stack offset
    const offset = (stack * this.size) / STACK_OFFSET_MULT;
    this.container.position.set(offset);
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.container);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  update(time: number) {
    if (this.finished > 0) {
      // Either hit or missed: Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);
      this.container.alpha = alpha;

      this.numberSprites.forEach(s => (s.alpha = 0));
      this.approachSprite.alpha = 0;
      3;

      // Expand hit circle
      const size =
        this.size * clerp(time - this.finished, 0, FADE_OUT_MS, 1, 1.2);
      this.circleSprite.scale.set(size / this.circleSprite.texture.width);

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
      this.container.alpha = alpha;

      // Update approach circle sizes
      const size =
        this.size * clerp(time, this.t - this.fadeTime, this.t, APPROACH_R, 1);
      this.approachSprite.scale.set(size / this.approachSprite.texture.width);
      return false;
    }

    // Waiting for hit
    this.container.alpha = 1;
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
