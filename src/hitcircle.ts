import * as PIXI from 'pixi.js';
import { clamp, lerp } from './util';
import { Skin } from './Skin';
import { arToMS, odToMS, csToSize } from './timing';

const APPROACH_R = 2.5;

export interface Stats {
  ar: number;
  od: number;
  cs: number;
}

enum HitSound {
  NORMAL = 1 << 0,
  WHISTLE = 1 << 1,
  FINISH = 1 << 2,
  CLAP = 1 << 3
}

export default class HitCircle {
  x: number;
  y: number;
  t: number;
  hitSound: HitSound;
  comboIndex: number; // Combo color index
  comboNumber: number;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  hitWindows: {
    300: number;
    100: number;
    50: number;
  };
  size: number; // Diameter of hit circle

  // Sprites
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Sprite[];

  constructor(tokens: string[], comboNumber: number, comboIndex: number) {
    this.x = parseInt(tokens[0]);
    this.y = parseInt(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]);
    this.comboNumber = comboNumber;
    this.comboIndex = comboIndex;

    const type = parseInt(tokens[3]);
  }

  load(skin: Skin, stats: Stats) {
    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(stats.ar);
    this.hitWindows = odToMS(stats.od);
    this.size = csToSize(stats.cs);

    // Load skin textures
    this.circleSprite = new PIXI.Sprite(skin.circle);
    this.circleSprite.position.set(this.x, this.y);
    this.circleSprite.width = this.size;
    this.circleSprite.height = this.size;
    this.circleSprite.visible = false;
    this.circleSprite.alpha = 0;

    this.approachSprite = new PIXI.Sprite(skin.approach);
    this.approachSprite.position.set(this.x, this.y);
    this.approachSprite.width = this.size * APPROACH_R;
    this.approachSprite.height = this.size * APPROACH_R;
    this.approachSprite.visible = false;
    this.approachSprite.alpha = 0;

    // Downscale numbers by 0.8x
    this.numberSprites = [];
    const length = Math.floor(Math.log10(this.comboNumber) + 1);
    const width = skin.numbers[0].width * 0.8;
    let digitX = this.x + ((length - 1) * width) / 2;
    let n = this.comboNumber;
    while (n > 0) {
      const sprite = new PIXI.Sprite(skin.numbers[n % 10]);
      sprite.width = width;
      sprite.position.set(digitX, this.y);
      sprite.visible = false;
      sprite.alpha = 0;
      this.numberSprites.push(sprite);

      digitX -= width;
      n = Math.floor(n / 10);
    }
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
    // TODO: don't update for fully opaque notes
    const alpha = clamp(
      lerp(time, this.t - this.fadeTime, this.t - this.fullTime, 0, 1),
      0,
      1
    );

    this.circleSprite.alpha = alpha;
    this.approachSprite.alpha = alpha;
    this.numberSprites.forEach(s => (s.alpha = alpha));

    // Update approach circle sizes
    const size =
      this.size *
      clamp(
        lerp(time, this.t - this.fadeTime, this.t, APPROACH_R, 1),
        1,
        APPROACH_R
      );
    this.approachSprite.width = size;
    this.approachSprite.height = size;
  }

  click(position: PIXI.Point) {
    const dx = position.x - this.x;
    const dy = position.y - this.y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
