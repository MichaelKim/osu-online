import * as PIXI from 'pixi.js';
import { APPROACH_R, FADE_OUT_MS, HitObjectTypes } from '.';
import GameState from '../GameState';
import { HitResultType } from '../HitResultController';
import { BeatmapData } from '../Loader/BeatmapLoader';
import {
  HitCircleData,
  HitCircleSprites,
  loadHitCircleSprites
} from '../Loader/HitCircleLoader';
import Skin from '../Skin';
import { arToMS, csToSize, odToMS } from '../timing';
import { clerp, clerp01, within } from '../util';

export default class HitCircle {
  readonly type = HitObjectTypes.HIT_CIRCLE;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  hitWindows: {
    [HitResultType.HIT300]: number;
    [HitResultType.HIT100]: number;
    [HitResultType.HIT50]: number;
  };
  size: number; // Diameter of hit circle

  // Sprites
  s: HitCircleSprites;

  // Gameplay
  finished = 0;

  constructor(
    readonly o: HitCircleData,
    beatmap: BeatmapData,
    skin: Skin,
    private gameState: GameState
  ) {
    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(beatmap.ar);
    this.hitWindows = odToMS(beatmap.od);
    this.size = csToSize(beatmap.cs);

    // Load sprites
    this.s = loadHitCircleSprites(this.o, beatmap, skin, this.size);
  }

  get start() {
    return new PIXI.Point(
      this.o.position.x + this.s.container.x,
      this.o.position.y + this.s.container.y
    );
  }

  get endTime() {
    return this.o.t;
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.s.container);
  }

  setVisible(visible: boolean) {
    this.s.container.visible = visible;
  }

  get enter() {
    return this.o.t - this.fadeTime;
  }

  update(time: number) {
    // Not visible yet
    if (time < this.o.t - this.fadeTime) {
      return false;
    }

    // Check for miss
    if (
      this.finished === 0 &&
      time > this.o.t + this.hitWindows[HitResultType.HIT50]
    ) {
      this.gameState.addResult(HitResultType.MISS, this, time);
      this.finished = time;
    }

    if (this.finished > 0) {
      // Either hit or missed: Fade out everything
      // Hit circle takes ~0.25s to fade out
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);
      this.s.container.alpha = alpha;

      // Expand hit circle (max ~1.6x scale)
      const size =
        clerp(time - this.finished, 0, FADE_OUT_MS, 1, 1.6) * this.size;
      this.s.circleSprite.scale.set(size / this.s.circleSprite.width);

      return time > this.finished + FADE_OUT_MS;
    }
    // Fade in
    if (time < this.o.t) {
      // TODO: don't update for fully opaque notes
      const alpha = clerp01(
        time,
        this.o.t - this.fadeTime,
        this.o.t - this.fullTime
      );
      this.s.container.alpha = alpha;

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
    this.s.container.alpha = 1;
    this.s.approachSprite.scale.set(
      this.size / this.s.approachSprite.texture.width
    );
    return false;
  }

  getHitResult(time: number) {
    const dt = Math.abs(time - this.o.t);
    if (dt <= this.hitWindows[HitResultType.HIT300])
      return HitResultType.HIT300;
    if (dt <= this.hitWindows[HitResultType.HIT100])
      return HitResultType.HIT100;
    if (dt <= this.hitWindows[HitResultType.HIT50]) return HitResultType.HIT50;
    return HitResultType.MISS;
  }

  hit(time: number, position: PIXI.Point) {
    if (within(position, this.o.position, this.size / 2)) {
      this.finished = time;

      const result = this.getHitResult(time);
      this.gameState.addResult(result, this, time);
    }
  }
}
