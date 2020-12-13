import * as PIXI from 'pixi.js';
import { clerp, clerp01 } from './util';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import {
  APPROACH_R,
  getNumberSprites,
  HitSound,
  initSprite,
  Stats
} from './HitObjects';

export default class HitCircle {
  // Metadata
  x: number;
  y: number;
  t: number;
  hitSound: HitSound;

  comboIndex: number; // Combo color index
  comboNumber: number;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Sprites
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Sprite[];

  constructor(tokens: string[], comboNumber: number, comboIndex: number) {
    // x,y,time,type,hitSound,objectParams,hitSample
    this.x = parseFloat(tokens[0]);
    this.y = parseFloat(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]);

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
      this.y
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
    // Not visible yet
    if (time < this.t - this.fadeTime) {
      return;
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
      return;
    }

    // Fade out everything
    const alpha = 1 - clerp01(time - this.t, 0, 100);

    this.circleSprite.alpha = alpha;
    this.numberSprites.forEach(s => (s.alpha = alpha));
    this.approachSprite.alpha = alpha;
  }

  click(position: PIXI.Point) {
    const dx = position.x - this.x;
    const dy = position.y - this.y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
