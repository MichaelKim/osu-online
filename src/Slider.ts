import * as PIXI from 'pixi.js';
import getCurve from './Bezier';
import { Stats } from './HitObjects';
import { HitSound } from './HitObjects';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import { clamp, lerp } from './util';

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
  type: CurveTypes;
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

  constructor(tokens: string[], comboNumber: number, comboIndex: number) {
    // x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
    const x = parseFloat(tokens[0]);
    const y = parseFloat(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]);

    const [curveType, ...curveTokens] = tokens[5].split('|');
    this.type = curveType as CurveTypes;
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

    this.circleSprite = new PIXI.Sprite(skin.circle);
    this.circleSprite.position.set(this.points[0].x, this.points[0].y);
    this.circleSprite.width = this.size;
    this.circleSprite.height = this.size;
    this.circleSprite.visible = false;
    this.circleSprite.alpha = 0;
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.circleSprite, this.graphics);
  }

  setVisible(visible: boolean) {
    this.circleSprite.visible = visible;
    this.graphics.visible = visible;
  }

  update(time: number) {
    let start = 0,
      end = 1;
    if (time < this.t) {
      // Slide in: [t - fade, t] -> [0, 1]
      end = clamp(lerp(time, this.t - this.fadeTime, this.t, 0, 1), 0, 1);
    } else if (time < this.t + this.sliderTime * (this.slides - 1)) {
      // Full slider
    } else if (time < this.t + this.sliderTime * this.slides) {
      // [t + sliderTime * (slides - 1), t + sliderTime * slides] -> [0, 1]
      if (this.slides % 2)
        start = clamp(
          lerp(
            time,
            this.t + this.sliderTime * (this.slides - 1),
            this.t + this.sliderTime * this.slides,
            0,
            1
          ),
          0,
          1
        );
      else
        end = clamp(
          lerp(
            time,
            this.t + this.sliderTime * (this.slides - 1),
            this.t + this.sliderTime * this.slides,
            1,
            0
          ),
          0,
          1
        );
    } else {
      end = 0;
    }

    // TODO: change to curve pointAt
    const startIndex = Math.floor(this.curve.length * start);
    const endIndex = Math.floor(this.curve.length * end);
    if (this.t === 2675) {
      console.log(start, end);
    }

    this.graphics.clear();
    this.graphics.lineStyle(5, 0xffffff);
    this.graphics.moveTo(this.curve[startIndex].x, this.curve[startIndex].y);
    for (let i = startIndex + 1; i < endIndex; i++) {
      this.graphics.lineTo(this.curve[i].x, this.curve[i].y);
    }

    const alpha = clamp(
      lerp(time, this.t - this.fadeTime, this.t - this.fullTime, 0, 1),
      0,
      1
    );

    this.circleSprite.position.set(
      this.curve[startIndex].x,
      this.curve[startIndex].y
    );
    this.circleSprite.alpha = alpha;
  }

  click(position: PIXI.Point) {
    const dx = position.x - this.points[0].x;
    const dy = position.y - this.points[0].y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
