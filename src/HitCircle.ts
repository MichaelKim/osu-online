import * as PIXI from 'pixi.js';
import { clerp, clerp01 } from './util';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import {
  APPROACH_R,
  BaseHitSound,
  FADE_OUT_MS,
  getNumberSprites,
  initSprite,
  ObjectTypes,
  Stats
} from './HitObjects';
import { SampleSet } from './TimingPoint';

export default class HitCircle {
  type = ObjectTypes.HIT_CIRCLE;

  // Metadata
  x: number;
  y: number;
  t: number;
  hitSound = BaseHitSound.NORMAL;

  // Beatmap
  comboIndex: number; // Combo color index
  comboNumber: number;
  sampleSet: SampleSet; // Sample set override

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Sprites
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Sprite[];

  finished = 0;

  constructor(tokens: string[], comboNumber: number, comboIndex: number) {
    // x,y,time,type,hitSound,objectParams,hitSample
    this.x = parseFloat(tokens[0]);
    this.y = parseFloat(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;

    this.comboNumber = comboNumber;
    this.comboIndex = comboIndex;
  }

  load(skin: Skin, stats: Stats) {
    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(stats.ar);
    this.size = csToSize(stats.cs);

    // Load skin textures
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
