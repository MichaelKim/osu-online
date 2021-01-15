import * as PIXI from 'pixi.js';
import { APPROACH_R, FADE_OUT_MS, HitObjectTypes, STACK_OFFSET_MULT } from '.';
import { BeatmapData } from '../Loader/BeatmapLoader';
import {
  HitCircleData,
  HitCircleSprites,
  loadHitCircleSprites
} from '../Loader/HitCircleLoader';
import { Skin } from '../Skin';
import { arToMS, csToSize } from '../timing';
import { clerp, clerp01, within } from '../util';

export default class HitCircle {
  readonly type = HitObjectTypes.HIT_CIRCLE;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Sprites
  container: PIXI.Container;
  s: HitCircleSprites;

  // Gameplay
  finished = 0;

  constructor(readonly o: HitCircleData, beatmap: BeatmapData, skin: Skin) {
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

    const offset = -(this.o.stackCount * this.size) / STACK_OFFSET_MULT;
    this.container.position.set(offset);
  }

  get start() {
    return new PIXI.Point(
      this.o.position.x + this.container.x,
      this.o.position.y + this.container.y
    );
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
    return within(position, this.o.position, this.size / 2);
  }
}
