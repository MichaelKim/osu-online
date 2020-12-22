import * as PIXI from 'pixi.js';
import { Bezier, Circle } from './Curve';
import {
  APPROACH_R,
  BaseHitSound,
  FADE_OUT_MS,
  FOLLOW_R,
  getNumberSprites,
  initSprite,
  ObjectTypes,
  SliderHitSound,
  STACK_OFFSET_MULT,
  Stats
} from './HitObjects';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import { SampleSet } from './TimingPoint';
import { clerp, clerp01, Tuple } from './util';

enum CurveTypes {
  BEZIER = 'B',
  CATMULL = 'C', // centripetal catmull-rom
  LINEAR = 'L',
  PERFECT = 'P' // circle
}

export class Slider {
  type = ObjectTypes.SLIDER;

  // Metadata
  x: number; // Position of the hit circle (initially at points[0])
  y: number;
  points: PIXI.Point[]; // Control points
  t: number;
  hitSound: BaseHitSound;
  sliderType: CurveTypes;
  slides: number; // Total number of slides (0 repeats = 1 slide)
  length: number;
  edgeSounds: BaseHitSound[] = [];
  edgeSets: Tuple<SampleSet, 2>[] = []; // [normal, addition]

  // Beatmap
  comboIndex: number; // Combo color index
  comboNumber: number;
  sampleSet: SampleSet; // Sample set override
  additionSet: SampleSet;
  stackCount: number = 0;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle
  sliderTime: number; // Without repeats
  endTime: number; // Total duration of slider
  ticks: number[] = [];

  // Rendering
  graphics: PIXI.Graphics;
  curve: PIXI.Point[];
  tickSprites: PIXI.Sprite[];
  circleSprite: PIXI.Sprite;
  approachSprite: PIXI.Sprite;
  numberSprites: PIXI.Sprite[];
  followSprite: PIXI.Sprite;
  reverseSprite: PIXI.Sprite;

  // Gameplay
  finished = 0;
  active = false; // Is the slider being followed?
  skin: Skin;
  ticksHit = 0; // Number of slider ticks already hit (per repeat)
  repeatsHit = 0; // Number of repeats (incl. slider ends) hit

  constructor(
    tokens: string[],
    comboNumber: number,
    comboIndex: number,
    sampleSet: SampleSet
  ) {
    // x,y,time,type,hitSound,curveType|curvePoints,slides,length,edgeSounds,edgeSets,hitSample
    this.x = parseFloat(tokens[0]);
    this.y = parseFloat(tokens[1]);
    this.t = parseInt(tokens[2]);
    this.hitSound = parseInt(tokens[4]) || BaseHitSound.NORMAL;

    const [curveType, ...curveTokens] = tokens[5].split('|');
    this.sliderType = curveType as CurveTypes;
    const otherPoints = curveTokens.map(t => {
      const [x, y] = t.split(':');
      return {
        x: parseFloat(x),
        y: parseFloat(y)
      };
    });
    this.points = [{ x: this.x, y: this.y }, ...otherPoints].map(
      ({ x, y }) => new PIXI.Point(x, y)
    );

    this.slides = parseInt(tokens[6]);
    this.length = parseFloat(tokens[7]);

    if (tokens.length > 8) {
      this.edgeSounds = tokens[8].split('|').map(t => parseInt(t));
    }

    if (tokens.length > 9) {
      const edgeSetTokens = tokens[9].split('|');
      this.edgeSets = edgeSetTokens.map(t => {
        const set = t.split(':');
        return [parseInt(set[0]), parseInt(set[1])];
      });
    }

    if (this.edgeSounds.length !== this.edgeSets.length) {
      console.warn('Mismatching edge sound lengths', tokens);
    }

    // TODO: normalSet:additionSet:index:volume:filename
    let hitSample: Tuple<SampleSet, 2> = [0, 0];
    if (tokens.length > 10) {
      const sampleTokens = tokens[10].split(':');
      hitSample = [parseInt(sampleTokens[0]), parseInt(sampleTokens[1])];
    }
    this.sampleSet = hitSample[0] || sampleSet;
    this.additionSet = hitSample[1] || hitSample[0];

    this.comboNumber = comboNumber;
    this.comboIndex = comboIndex;

    this.graphics = new PIXI.Graphics();

    // Calculate curve points
    if (this.sliderType === CurveTypes.PERFECT && this.points.length === 3) {
      this.curve = Circle.getCurve(this.points, this.length);
    } else {
      this.curve = Bezier.getCurve(
        this.points,
        this.sliderType === CurveTypes.LINEAR,
        this.length
      );
    }
  }

  load(skin: Skin, stats: Stats) {
    this.skin = skin;
    [this.fadeTime, this.fullTime] = arToMS(stats.ar);
    this.size = csToSize(stats.cs);

    // Stack offset
    if (this.stackCount !== 0) {
      const offset = (this.stackCount * this.size) / STACK_OFFSET_MULT;
      this.x -= offset;
      this.y -= offset;
      this.curve.forEach(c => {
        c.x -= offset;
        c.y -= offset;
      });
    }

    this.circleSprite = initSprite(skin.circle, this.x, this.y, this.size);
    this.approachSprite = initSprite(
      skin.approach,
      this.x,
      this.y,
      this.size * APPROACH_R
    );
    this.followSprite = initSprite(
      skin.sliderFollowCircle,
      this.x,
      this.y,
      this.size * FOLLOW_R
    );
    this.numberSprites = getNumberSprites(
      skin,
      this.comboNumber,
      this.x,
      this.y,
      this.size
    );

    this.tickSprites = this.ticks.map(t => {
      const index = Math.floor(this.curve.length * t);
      const point = this.curve[index];

      return initSprite(skin.sliderScorePoint, point.x, point.y);
    });

    const endPosition = this.curve[this.curve.length - 1];
    // TODO: Should scale with circle size
    this.reverseSprite = initSprite(
      skin.reverseArrow,
      endPosition.x,
      endPosition.y
    );
    const dx = this.points[this.points.length - 2].x - endPosition.x;
    const dy = this.points[this.points.length - 2].y - endPosition.y;
    this.reverseSprite.rotation = Math.atan2(dy, dx);
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(
      this.graphics,
      ...this.tickSprites,
      this.reverseSprite,
      this.circleSprite,
      this.followSprite,
      ...this.numberSprites,
      this.approachSprite
    );
  }

  setVisible(visible: boolean) {
    this.graphics.visible = visible;
    this.tickSprites.forEach(s => (s.visible = visible));
    this.reverseSprite.visible = visible;
    this.circleSprite.visible = visible;
    this.approachSprite.visible = visible;
    this.followSprite.visible = visible;
    this.numberSprites.forEach(s => (s.visible = visible));
  }

  // Returns [start, end]
  calcIndices(time: number) {
    // One less slide
    const outTime = this.endTime - this.sliderTime;

    // Snake in: [t - fade, t - full] -> [0, 1]
    // TODO: this still feels too late
    if (time < this.t - this.fullTime) {
      return [0, clerp01(time, this.t - this.fadeTime, this.t - this.fullTime)];
    }

    // Full slider
    if (time < outTime) {
      return [0, 1];
    }

    // Snake out: [t + sliderTime * (slides - 1), t + sliderTime * slides] -> [0, 1]
    if (time < this.endTime) {
      // Odd number of slides: start moves in
      if (this.slides % 2) {
        return [clerp01(time, outTime, this.endTime), 1];
      }

      // Even slides: end moves in
      return [0, 1 - clerp01(time, outTime, this.endTime)];
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

  playEdge(index: number) {
    const hitSound = this.edgeSounds[index] || this.hitSound;
    // [normal, addition]
    const setIndex = hitSound === BaseHitSound.NORMAL ? 0 : 1;
    const sampleSet = this.edgeSets[index]?.[setIndex] || this.sampleSet;
    this.skin.playSound(sampleSet, hitSound);
  }

  update(time: number) {
    if (this.finished > 0) {
      // Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);

      // TODO: fade these out starting from their own alphas
      this.approachSprite.alpha = 0;
      this.circleSprite.alpha = 0;
      this.numberSprites.forEach(s => (s.alpha = 0));
      this.tickSprites.forEach(s => (s.alpha = 0));
      this.reverseSprite.alpha = 0;

      this.graphics.alpha = alpha;
      this.followSprite.alpha = alpha;
      return time > this.finished + FADE_OUT_MS;
    }

    // Not visible yet
    if (time < this.t - this.fadeTime) {
      return false;
    }

    this.updateSlider(time);

    // Fade in
    if (time < this.t) {
      const alpha = clerp01(
        time,
        this.t - this.fadeTime,
        this.t - this.fullTime
      );

      // Slider
      this.graphics.alpha = alpha;

      // Hit circle
      this.circleSprite.alpha = alpha;
      this.approachSprite.alpha = alpha;
      this.numberSprites.forEach(s => (s.alpha = alpha));

      // Update approach circle sizes
      const size =
        this.size * clerp(time, this.t - this.fadeTime, this.t, APPROACH_R, 1);
      this.approachSprite.scale.set(size / this.approachSprite.texture.width);

      // Reverse arrow
      if (this.slides > 1) {
        this.reverseSprite.alpha = clerp01(
          time,
          this.t - this.fullTime,
          this.t - this.fullTime + 100
        );
      }
      return false;
    }

    // Slider active
    // Check if slider is finished
    if (this.active && time > this.endTime) {
      this.finished = time;

      // Play slider end hit sound
      this.playEdge(this.edgeSounds.length - 1);

      return false;
    }

    // Update slider ball
    const progress = (time - this.t) / this.sliderTime; // Current repeat
    const forwards = Math.floor(progress) % 2 === 0; // Sliding direction
    const delta = forwards ? progress % 1 : 1 - (progress % 1);
    // TODO: use pointAt
    const curveIndex = Math.floor(this.curve.length * delta);
    const position = this.curve[curveIndex];

    const alpha = 1 - clerp01(time - this.t, 0, this.fadeTime - this.fullTime);

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

    // Update slider ticks
    let tickStart = 0,
      tickEnd = 1;
    if (forwards) {
      tickStart = delta;
    } else {
      tickEnd = delta;
    }
    let ticksHitNew = 0;
    for (let i = 0; i < this.ticks.length; i++) {
      // TODO: ticks are evenly spaced, so [0, end] -> [length - end, 1] is more efficient
      if (this.ticks[i] > tickStart && this.ticks[i] < tickEnd) {
        // TODO: fade in and pop out
        this.tickSprites[i].alpha = 1;
      } else {
        this.tickSprites[i].alpha = 0;
        ticksHitNew++;
      }
    }

    // Play tick hit sound
    if (this.active) {
      for (let i = this.ticksHit; i < ticksHitNew; i++) {
        // Number of ticks hit increased: new ticks
        this.skin.playSound(this.sampleSet, SliderHitSound.SLIDER_TICK);
      }
    }
    this.ticksHit = ticksHitNew;

    // Play slider end hit sound
    if (this.active) {
      const currentSlide = Math.floor(progress);
      if (this.repeatsHit !== currentSlide) {
        this.playEdge(currentSlide);
        this.repeatsHit = currentSlide;
      }
    }

    this.x = position.x;
    this.y = position.y;

    return false;
  }

  hit(position: PIXI.Point) {
    const dx = position.x - this.x;
    const dy = position.y - this.y;
    // Once active, cursor needs to stay within follow circle
    const scale = this.active ? FOLLOW_R : 1;
    const r = (scale * this.size) / 2;
    return dx * dx + dy * dy < r * r;
  }
}
