import * as PIXI from 'pixi.js';
import { APPROACH_R, FADE_OUT_MS, FOLLOW_R, HitObjectTypes } from '.';
import GameState from '../GameState';
import { HitResultType } from '../HitResultController';
import { BeatmapData } from '../Loader/BeatmapLoader';
import {
  loadSliderSprites,
  SliderData,
  SliderSprites
} from '../Loader/SliderLoader';
import Skin from '../Skin';
import { arToMS, csToSize, odToMS } from '../timing';
import { clerp, clerp01, within } from '../util';

// Semi-circle
const MAX_RES = 24;

export default class Slider {
  readonly type = HitObjectTypes.SLIDER;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  hitWindows: {
    [HitResultType.HIT300]: number;
    [HitResultType.HIT100]: number;
    [HitResultType.HIT50]: number;
  };
  size: number; // Diameter of hit circle

  // Rendering
  s: SliderSprites;

  // Gameplay
  position: PIXI.Point; // Slider head position
  finished = 0;
  active = false; // Is the slider being followed?
  ticksHit = 0; // Number of slider ticks already hit (per repeat)
  repeatsHit = 0; // Number of repeats (incl. slider ends) hit

  constructor(
    readonly o: SliderData,
    beatmap: BeatmapData,
    skin: Skin,
    private gameState: GameState
  ) {
    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(beatmap.ar);
    this.hitWindows = odToMS(beatmap.od);
    this.size = csToSize(beatmap.cs);

    this.s = loadSliderSprites(this.o, beatmap, skin, this.size);

    this.position = this.start;
  }

  get start() {
    const point = this.o.curve[0];
    return new PIXI.Point(
      point.x + this.s.container.x,
      point.y + this.s.container.y
    );
  }

  get end() {
    const point = this.o.curve[this.o.curve.length - 1];
    return new PIXI.Point(
      point.x + this.s.container.x,
      point.y + this.s.container.y
    );
  }

  get endTime() {
    return this.o.endTime;
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

  // Returns [start, end]
  private calcIndices(time: number) {
    // One less slide
    const outTime = this.o.endTime - this.o.sliderTime;

    // Snake in: [t - fade, t - full] -> [0, 1]
    // TODO: this still feels too late
    if (time < this.o.t - this.fullTime) {
      return [
        0,
        clerp01(time, this.o.t - this.fadeTime, this.o.t - this.fullTime)
      ];
    }

    // Full slider
    if (time < outTime) {
      return [0, 1];
    }

    // Snake out: [t + sliderTime * (slides - 1), t + sliderTime * slides] -> [0, 1]
    if (time < this.o.endTime) {
      // Odd number of slides: start moves in
      if (this.o.slides % 2) {
        return [clerp01(time, outTime, this.o.endTime), 1];
      }

      // Even slides: end moves in
      return [0, 1 - clerp01(time, outTime, this.o.endTime)];
    }

    // Slider finished
    if (this.o.slides % 2) {
      // Odd number of slides: finishes at end
      return [1, 1];
    }
    // Even number of slides: finishes at start
    return [0, 0];
  }

  private pointAt(t: number) {
    // Estimate index ([0, 1] => [0, curve.length - 1])
    const position = (this.o.curve.length - 1) * t;
    const index = t === 1 ? this.o.curve.length - 2 : Math.floor(position);

    // Interpolate point
    const startT = position - index; // [0, 1]
    const point = new PIXI.Point(
      this.o.curve[index].x * (1 - startT) + this.o.curve[index + 1].x * startT,
      this.o.curve[index].y * (1 - startT) + this.o.curve[index + 1].y * startT
    );

    return {
      point,
      index
    };
  }

  // Returns list of curve points from start to end
  private getPoints(startT: number, endT: number) {
    const start = this.pointAt(startT);
    const end = this.pointAt(endT);

    return [
      start.point,
      ...this.o.curve.slice(start.index + 1, end.index + 1),
      end.point
    ];
  }

  private updateCap(center: PIXI.Point, theta: number) {
    const points: number[] = [];
    const texturePoints: number[] = [];

    for (let i = 0; i < MAX_RES; i++) {
      // Each triangle is composed of the center,
      // and the two points along the circumference (starting from 0, step to PI - step, PI)
      const t1 = theta + (i * Math.PI) / MAX_RES;
      const p1x = (Math.cos(t1) * this.size) / 2 + center.x;
      const p1y = (Math.sin(t1) * this.size) / 2 + center.y;

      const t2 = theta + ((i + 1) * Math.PI) / MAX_RES;
      const p2x = (Math.cos(t2) * this.size) / 2 + center.x;
      const p2y = (Math.sin(t2) * this.size) / 2 + center.y;

      points.push(center.x, center.y, p1x, p1y, p2x, p2y);
      texturePoints.push(1, 0, 0);
    }

    return { points, texturePoints };
  }

  private updateSlider(time: number) {
    const vertices: number[] = [];
    const textureVertices: number[] = [];

    const [startT, endT] = this.calcIndices(time);
    const curve = this.getPoints(startT, endT);

    // Draw head
    const startAngle = Math.atan2(
      curve[1].y - curve[0].y,
      curve[1].x - curve[0].x
    );
    const startCap = this.updateCap(curve[0], startAngle + Math.PI / 2);
    vertices.push(...startCap.points);
    textureVertices.push(...startCap.texturePoints);

    // Draw quads
    for (let i = 0; i < curve.length - 1; i++) {
      // For each pair of points in the curve
      const p1 = curve[i];
      const p2 = curve[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);

      // Find the tangent to the line segment
      const tx = -dy / length;
      const ty = dx / length;

      // Extend length radius past each point along the tangent
      const v1x = p1.x - (tx * this.size) / 2;
      const v1y = p1.y - (ty * this.size) / 2;

      const v2x = p1.x + (tx * this.size) / 2;
      const v2y = p1.y + (ty * this.size) / 2;

      const v3x = p2.x - (tx * this.size) / 2;
      const v3y = p2.y - (ty * this.size) / 2;

      const v4x = p2.x + (tx * this.size) / 2;
      const v4y = p2.y + (ty * this.size) / 2;

      // The four points form a quad
      // Splitting along the line yields two quads
      // Each quad is drawn as two triangles
      vertices.push(v1x, v1y, p1.x, p1.y, v3x, v3y);
      textureVertices.push(0, 1, 0);
      vertices.push(p1.x, p1.y, v3x, v3y, p2.x, p2.y);
      textureVertices.push(1, 0, 1);

      vertices.push(p1.x, p1.y, v2x, v2y, v4x, v4y);
      textureVertices.push(1, 0, 0);
      vertices.push(p1.x, p1.y, p2.x, p2.y, v4x, v4y);
      textureVertices.push(1, 1, 0);

      // Draw cap
      // TODO: possible optimization? draw only the outer edge instead of entire semi-circle
      const cap = this.updateCap(p2, Math.atan2(dy, dx) - Math.PI / 2);
      vertices.push(...cap.points);
      textureVertices.push(...cap.texturePoints);
    }

    // TODO: use index buffers to remote duplicate vertices
    // Add vertices
    this.s.mesh.geometry
      .getBuffer('position')
      .update(new Float32Array(vertices));
    // Add texture coords
    this.s.mesh.geometry
      .getBuffer('tex_position')
      .update(new Float32Array(textureVertices));
  }

  update(time: number) {
    // Check for miss
    if (
      this.finished === 0 &&
      !this.active &&
      time > this.o.t + this.hitWindows[HitResultType.HIT50]
    ) {
      this.gameState.addResult(HitResultType.MISS, this, time);
      this.finished = time;
    }

    if (this.finished > 0) {
      // Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);
      this.s.container.alpha = alpha;

      this.updateSlider(time);

      return time > this.finished + FADE_OUT_MS;
    }

    // Not visible yet
    if (time < this.o.t - this.fadeTime) {
      return false;
    }

    this.updateSlider(time);

    // Fade in
    if (time < this.o.t) {
      const alpha = clerp01(
        time,
        this.o.t - this.fadeTime,
        this.o.t - this.fullTime
      );
      this.s.container.alpha = alpha;

      // Slider
      this.s.followSprite.alpha = 0;
      this.s.reverseSprite.alpha = 0;

      // Update approach circle sizes
      const size =
        this.size *
        clerp(time, this.o.t - this.fadeTime, this.o.t, APPROACH_R, 1);
      this.s.approachSprite.scale.set(
        size / this.s.approachSprite.texture.width
      );

      // Reverse arrow
      if (this.o.slides > 1) {
        this.s.reverseSprite.alpha = clerp01(
          time,
          this.o.t - this.fullTime,
          this.o.t - this.fullTime + 100
        );
      }
      return false;
    }

    // Slider active
    // Check if slider is finished
    if (this.active && time > this.o.endTime) {
      this.finished = time;

      // Play slider end hit sound
      this.gameState.addSliderEdge(this, time, this.o.edgeSounds.length - 1);

      return false;
    }

    // Update slider ball
    const progress = (time - this.o.t) / this.o.sliderTime; // Current repeat
    const forwards = Math.floor(progress) % 2 === 0; // Sliding direction
    const delta = forwards ? progress % 1 : 1 - (progress % 1); // [0, 1]
    const position = this.pointAt(delta).point;

    const alpha =
      1 - clerp01(time - this.o.t, 0, this.fadeTime - this.fullTime);
    this.s.container.alpha = 1;

    // Fade out hit circle, combo number, approach circle
    // TODO: these might actually instantly fade out once hit
    this.s.circleSprite.alpha = alpha;
    this.s.circleSprite.position.copyFrom(position);

    this.s.numberSprites.alpha = alpha;
    this.s.numberSprites.position.copyFrom(position);

    this.s.approachSprite.alpha = alpha;
    this.s.approachSprite.position.copyFrom(position);

    // Fade in follow circle
    this.s.followSprite.alpha = clerp01(time - this.o.t, 0, 150);
    this.s.followSprite.position.copyFrom(position);
    // Expand follow circle
    const size = this.size * clerp(time - this.o.t, 0, 150, 1, FOLLOW_R);
    this.s.followSprite.scale.set(size / this.s.followSprite.texture.width);

    // Update slider ticks
    let tickStart = 0,
      tickEnd = 1;
    if (forwards) {
      tickStart = delta;
    } else {
      tickEnd = delta;
    }
    let ticksHitNew = 0;
    for (let i = 0; i < this.o.ticks.length; i++) {
      // TODO: ticks are evenly spaced, so [0, end] -> [length - end, 1] is more efficient
      if (this.o.ticks[i] > tickStart && this.o.ticks[i] < tickEnd) {
        // TODO: fade in and pop out
        this.s.tickSprites[i].alpha = 1;
      } else {
        this.s.tickSprites[i].alpha = 0;
        ticksHitNew++;
      }
    }

    // Play tick hit sound
    if (this.active) {
      for (let i = this.ticksHit; i < ticksHitNew; i++) {
        // Number of ticks hit increased: new ticks
        this.gameState.addSliderTick(this, time);
      }
    }
    this.ticksHit = ticksHitNew;

    // Play slider end hit sound
    if (this.active) {
      const currentSlide = Math.floor(progress);
      if (this.repeatsHit !== currentSlide) {
        this.gameState.addSliderEdge(this, time, currentSlide);
        this.repeatsHit = currentSlide;
      }
    }

    this.position.copyFrom(position);

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
    // Hitbox follows the slider head after slider starts
    if (!this.active && within(position, this.position, this.size / 2)) {
      this.active = true;

      const result = this.getHitResult(time);
      this.gameState.addSliderHead(result, this, time);
    }
  }

  move(time: number, position: PIXI.Point) {
    // Once active, cursor needs to stay within follow circle
    if (
      this.active &&
      !within(position, this.position, (FOLLOW_R * this.size) / 2)
    ) {
      // Active slider was left (slider break)
      this.active = false;
      this.finished = time;
    }
  }

  up(time: number, position: PIXI.Point) {
    if (this.active) {
      // Active slider was let go (slider break)
      this.active = false;
      this.finished = time;
    }
  }
}
