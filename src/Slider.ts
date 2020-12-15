import * as PIXI from 'pixi.js';
import getCurve from './Bezier';
import {
  APPROACH_R,
  FOLLOW_R,
  getNumberSprites,
  initSprite,
  Stats
} from './HitObjects';
import { HitSound } from './HitObjects';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import { clerp, clerp01 } from './util';

enum CurveTypes {
  BEZIER = 'B',
  CATMULL = 'C', // centripetal catmull-rom
  LINEAR = 'L',
  PERFECT = 'P' // circle
}

export class Slider {
  // Metadata
  points: PIXI.Point[];
  t: number;
  hitSound: HitSound;
  sliderType: CurveTypes;
  slides: number;
  length: number;

  comboIndex: number; // Combo color index
  comboNumber: number;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle
  sliderTime: number; // Without repeats

  // Rendering
  graphics: PIXI.Graphics;
  curve: PIXI.Point[];
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Sprite[];
  followSprite: PIXI.Sprite;

  active: boolean = false; // Is the slider being followed?

  constructor(tokens: string[], comboNumber: number, comboIndex: number) {
    // x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
    const x = parseFloat(tokens[0]);
    const y = parseFloat(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]);

    const [curveType, ...curveTokens] = tokens[5].split('|');
    this.sliderType = curveType as CurveTypes;
    const otherPoints = curveTokens.map(t => {
      const [x, y] = t.split(':');
      return {
        x: parseFloat(x),
        y: parseFloat(y)
      };
    });
    this.points = [{ x, y }, ...otherPoints].map(
      ({ x, y }) => new PIXI.Point(x, y)
    );

    this.slides = parseInt(tokens[6]);
    this.length = parseFloat(tokens[7]);

    if (tokens.length > 8) {
      const edgeSoundTokens = tokens[8].split('|');
    }
    if (tokens.length > 9) {
      const edgeSetTokens = tokens[8].split('|');
    }

    this.comboNumber = comboNumber;
    this.comboIndex = comboIndex;

    this.graphics = new PIXI.Graphics();
  }

  load(skin: Skin, stats: Stats) {
    [this.fadeTime, this.fullTime] = arToMS(stats.ar);
    this.size = csToSize(stats.cs);

    // Calculate curve points
    this.curve = getCurve(this.points, this.length);

    this.circleSprite = initSprite(
      skin.circle,
      this.points[0].x,
      this.points[0].y,
      this.size
    );
    this.approachSprite = initSprite(
      skin.approach,
      this.points[0].x,
      this.points[0].y,
      this.size * APPROACH_R
    );
    this.followSprite = initSprite(
      skin.sliderFollowCircle,
      this.points[0].x,
      this.points[0].y,
      this.size * FOLLOW_R
    );
    this.numberSprites = getNumberSprites(
      skin,
      this.comboNumber,
      this.points[0].x,
      this.points[0].y,
      this.size
    );
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(
      this.graphics,
      this.circleSprite,
      this.followSprite,
      ...this.numberSprites,
      this.approachSprite
    );
  }

  setVisible(visible: boolean) {
    this.graphics.visible = visible;
    this.circleSprite.visible = visible;
    this.approachSprite.visible = visible;
    this.followSprite.visible = visible;
    this.numberSprites.forEach(s => (s.visible = visible));
  }

  calcIndices(time: number) {
    const outTime = this.t + this.sliderTime * (this.slides - 1);
    const endTime = this.t + this.sliderTime * this.slides;

    // Slide in: [t - fade, t] -> [0, 1]
    if (time < this.t) {
      return [0, clerp01(time, this.t - this.fadeTime, this.t)];
    }

    // Full slider
    if (time < outTime) {
      return [0, 1];
    }

    // Slide out: [t + sliderTime * (slides - 1), t + sliderTime * slides] -> [0, 1]
    if (time < endTime) {
      // Odd number of slides: start moves in
      if (this.slides % 2) {
        return [clerp01(time, outTime, endTime), 1];
      }

      // Even slides: end moves in
      return [0, 1 - clerp01(time, outTime, endTime)];
    }

    // Slider finished
    return [0, 0];
  }

  updateSlider(time: number) {
    const [start, end] = this.calcIndices(time);

    // TODO: change to curve pointAt
    const startIndex = Math.floor(this.curve.length * start);
    const endIndex = Math.floor(this.curve.length * end);

    this.graphics.clear();
    this.graphics.lineStyle(5, 0xffffff);
    this.graphics.moveTo(this.curve[startIndex].x, this.curve[startIndex].y);
    for (let i = startIndex + 1; i < endIndex; i++) {
      this.graphics.lineTo(this.curve[i].x, this.curve[i].y);
    }
  }

  update(time: number) {
    // Not visible yet
    if (time < this.t - this.fadeTime) {
      return;
    }

    this.updateSlider(time);

    // Fade in
    if (time < this.t) {
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

    const endTime = this.t + this.sliderTime * this.slides;

    // Slider active
    if (time < endTime) {
      // Update slider ball
      const slide = (time - this.t) / this.sliderTime;
      const forwards = Math.floor(slide) % 2; // Sliding direction
      const delta = forwards ? 1 - (slide % 1) : slide % 1;
      // TODO: use pointAt
      const curveIndex = Math.floor(this.curve.length * delta);
      const position = this.curve[curveIndex];

      const alpha =
        1 - clerp01(time - this.t, 0, this.fadeTime - this.fullTime);

      // Fade out hit circle, combo number, approach circle
      this.circleSprite.alpha = alpha;
      this.circleSprite.position.copyFrom(position);

      this.numberSprites.forEach(s => {
        s.alpha = alpha;
        s.position.copyFrom(position);
      });

      this.approachSprite.alpha = alpha;
      this.approachSprite.position.copyFrom(position);

      // Fade in follow circle
      this.followSprite.alpha = clerp01(time - this.t, 0, 150);
      this.followSprite.position.copyFrom(position);
      // Expand follow circle
      const size = this.size * clerp(time - this.t, 0, 150, 1, FOLLOW_R);
      this.followSprite.scale.set(size / this.followSprite.texture.width);

      return;
    }

    // Fade out everything
    const alpha = 1 - clerp01(time - endTime, 0, 100);

    this.graphics.alpha = alpha;
    this.circleSprite.alpha = alpha;
    this.followSprite.alpha = alpha;
    this.numberSprites.forEach(s => (s.alpha = alpha));
    this.approachSprite.alpha = alpha;
    this.followSprite.alpha = alpha;
  }

  click(position: PIXI.Point) {
    const dx = position.x - this.points[0].x;
    const dy = position.y - this.points[0].y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
