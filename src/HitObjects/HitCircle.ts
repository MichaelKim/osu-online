import * as PIXI from 'pixi.js';
import Beatmap from '../Beatmap';
import { APPROACH_R, FADE_OUT_MS, HitObjectTypes, STACK_OFFSET_MULT } from '.';
import {
  HitCircleData,
  HitCircleSprites,
  loadHitCircleSprites,
  parseHitCircle
} from '../Loader/HitCircleLoader';
import { TimingPoint } from '../Loader/TimingPointLoader';
import { Skin } from '../Skin';
import { arToMS, csToSize } from '../timing';
import { clerp, clerp01 } from '../util';

export default class HitCircle {
  readonly type = HitObjectTypes.HIT_CIRCLE;

  // Hit object data
  o: HitCircleData;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Sprites
  container: PIXI.Container;
  s: HitCircleSprites;

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
    this.o = parseHitCircle(
      tokens,
      comboNumber,
      comboIndex,
      timingPoint,
      beatmap
    );

    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(beatmap.ar);
    this.size = csToSize(beatmap.cs);

    // Load sprites
    this.s = loadHitCircleSprites(this.o, skin, this.size);

    this.container = new PIXI.Container();
    this.container.visible = false;
    this.container.addChild(
      this.s.circleSprite,
      this.s.numberSprites,
      this.s.approachSprite
    );
  }

  set stackCount(stack: number) {
    // Stack offset
    const offset = (stack * this.size) / STACK_OFFSET_MULT;
    this.container.position.set(offset);
  }

  get start() {
    return new PIXI.Point(this.o.x, this.o.y);
  }

  get endTime() {
    return this.o.t;
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

      this.s.numberSprites.alpha = 0;
      this.s.approachSprite.alpha = 0;

      // Expand hit circle
      const size =
        this.size * clerp(time - this.finished, 0, FADE_OUT_MS, 1, 1.2);
      this.s.circleSprite.scale.set(size / this.s.circleSprite.texture.width);

      return time > this.finished + FADE_OUT_MS;
    }

    // Not visible yet
    if (time < this.o.t - this.fadeTime) {
      return false;
    }

    // Fade in
    if (time < this.o.t) {
      // TODO: don't update for fully opaque notes
      const alpha = clerp01(
        time,
        this.o.t - this.fadeTime,
        this.o.t - this.fullTime
      );
      this.container.alpha = alpha;

      // Update approach circle sizes
      const size =
        this.size *
        clerp(time, this.o.t - this.fadeTime, this.o.t, APPROACH_R, 1);
      this.s.approachSprite.scale.set(
        size / this.s.approachSprite.texture.width
      );
      return false;
    }

    // Waiting for hit
    this.container.alpha = 1;
    this.s.approachSprite.scale.set(
      this.size / this.s.approachSprite.texture.width
    );
    return false;
  }

  hit(position: PIXI.Point) {
    const dx = position.x - this.o.x;
    const dy = position.y - this.o.y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
