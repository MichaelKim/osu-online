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
import { clerp, clerp01, Tuple, within } from '../util';

// Semi-circle
const MAX_RES = 24;

type Line = Readonly<{
  start: PIXI.Point;
  end: PIXI.Point;
  offset: PIXI.Point;
  angle: number;
}>;

enum State {
  NONE,
  DOWN, // Cursor down, not in slider
  ACTIVE // Cursor down, slider active
}

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
  lines: Line[] = [];

  // Gameplay
  position: PIXI.Point; // Slider head position
  finished: number = 0;
  headHit: number = 0; // When the slider head was hit (0 if not hit)
  state: State = State.NONE;
  lastTicks = 0; // Number of ticks passed (per repeat) last frame
  lastForwards: boolean = true; // Slider direction last frame

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

    for (let i = 0; i < this.o.curve.length - 1; i++) {
      // For each pair of points in the curve
      const p1 = this.o.curve[i];
      const p2 = this.o.curve[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);

      // Find the offset tangent to the line segment
      const offset = new PIXI.Point(
        ((-dy / length) * this.size) / 2,
        ((dx / length) * this.size) / 2
      );

      this.lines.push({
        start: p1,
        end: p2,
        offset,
        angle: Math.atan2(dy, dx)
      });
    }
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
    const position = this.lines.length * t; // [0, 1] => [0, curve.length - 1]
    // Line segment index
    const index = t === 1 ? this.lines.length - 1 : Math.floor(position); // [0, curve.length - 2]

    // Interpolate point
    const startT = position - index; // [0, 1]
    const point = new PIXI.Point(
      this.lines[index].start.x * (1 - startT) +
        this.lines[index].end.x * startT,
      this.lines[index].start.y * (1 - startT) +
        this.lines[index].end.y * startT
    );

    return {
      point,
      index
    };
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

    // Slider end positions
    const [startT, endT] = this.calcIndices(time);
    const start = this.pointAt(startT);
    const end = this.pointAt(endT);

    // Draw head
    const startAngle = this.lines[start.index].angle;
    const startCap = this.updateCap(start.point, startAngle + Math.PI / 2);
    vertices.push(...startCap.points);
    textureVertices.push(...startCap.texturePoints);

    // Draw quads
    for (let i = start.index; i < end.index + 1; i++) {
      // For each pair of points in the curve
      const p1 = i === start.index ? start.point : this.lines[i].start;
      const p2 = i === end.index ? end.point : this.lines[i].end;

      // Find the tangent to the line segment
      const offset = this.lines[i].offset;

      // Extend length radius past each point along the tangent
      const v1x = p1.x - offset.x;
      const v1y = p1.y - offset.y;

      const v2x = p1.x + offset.x;
      const v2y = p1.y + offset.y;

      const v3x = p2.x - offset.x;
      const v3y = p2.y - offset.y;

      const v4x = p2.x + offset.x;
      const v4y = p2.y + offset.y;

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
      const cap = this.updateCap(p2, this.lines[i].angle - Math.PI / 2);
      vertices.push(...cap.points);
      textureVertices.push(...cap.texturePoints);
    }

    // TODO: possible optimization? use index buffers to remote duplicate vertices
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
    // Not visible yet
    if (time < this.enter) {
      return false;
    }

    this.updateSlider(time);

    if (time > this.o.endTime && this.finished === 0) {
      this.finished = time;

      // Check if slider is finished
      if (this.state === State.ACTIVE) {
        // Play slider end hit sound
        this.gameState.addSliderEdge(this, time, this.o.edgeSounds.length - 1);
      }
    }

    if (this.finished > 0) {
      // Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);
      this.s.container.alpha = alpha;

      return time > this.finished + FADE_OUT_MS;
    }

    this.s.reverseSprites.update(time);

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
      this.s.ballSprite.alpha = 0;

      // Update approach circle sizes
      const scale = clerp(
        time,
        this.o.t - this.fadeTime,
        this.o.t,
        APPROACH_R,
        1
      );
      this.s.approachSprite.scale.set(
        (scale * this.size) / this.s.approachSprite.texture.width
      );

      return false;
    }

    this.s.container.alpha = 1;

    const progress = (time - this.o.t) / this.o.sliderTime; // Current repeat
    const forwards = Math.floor(progress) % 2 === 0; // Sliding direction
    const delta = forwards ? progress % 1 : 1 - (progress % 1); // [0, 1]
    const position = this.pointAt(delta).point;

    // Update hit circle
    if (this.headHit === 0 && this.getHitResult(time) !== HitResultType.MISS) {
      // Head can still be hit: hit circle follows slider ball
      this.s.circleSprite.position.copyFrom(position);
      this.s.numberSprites.position.copyFrom(position);
      this.s.approachSprite.position.copyFrom(position);
    } else {
      // Fade out head
      const hitTime =
        this.headHit > 0
          ? this.headHit
          : this.o.t + this.hitWindows[HitResultType.HIT50];

      // Hit circle takes ~0.25s to fade out
      const circleAlpha = 1 - clerp01(time - hitTime, 0, FADE_OUT_MS);
      this.s.circleSprite.alpha = circleAlpha;
      this.s.numberSprites.alpha = circleAlpha;
      this.s.approachSprite.alpha = circleAlpha;
      // Expand hit circle (max ~1.6x scale)
      const circleSize =
        clerp(time - hitTime, 0, FADE_OUT_MS, 1, 1.6) * this.size;
      this.s.circleSprite.scale.set(circleSize / this.s.circleSprite.width);
    }

    // Fade in follow circle
    const fadeIn = clerp01(time - this.o.t, 0, 150);
    this.s.followSprite.alpha = fadeIn;
    this.s.followSprite.position.copyFrom(position);
    // Expand follow circle
    const followScale = clerp(time - this.o.t, 0, 150, 1, FOLLOW_R);
    this.s.followSprite.scale.set(
      (followScale * this.size) / this.s.followSprite.texture.width
    );

    // Update slider ball
    this.s.ballSprite.alpha = fadeIn;
    this.s.ballSprite.position.copyFrom(position);

    // Update slider ticks
    const [tickStart, tickEnd] = forwards ? [delta, 1] : [0, delta];
    let ticks = 0;
    for (let i = 0; i < this.o.ticks.length; i++) {
      // TODO: ticks are evenly spaced, so [0, end] -> [length - end, 1] is more efficient
      if (this.o.ticks[i] > tickStart && this.o.ticks[i] < tickEnd) {
        // TODO: fade in and pop out
        this.s.tickSprites[i].alpha = 1;
      } else {
        this.s.tickSprites[i].alpha = 0;
        ticks++;
      }
    }

    if (this.state === State.ACTIVE) {
      // Play tick hit sound
      for (let i = this.lastTicks; i < ticks; i++) {
        // Number of ticks hit increased: new ticks
        this.gameState.addSliderTick(this, time);
      }
    }

    // Play slider end hit sound
    if (this.lastForwards !== forwards) {
      // Switched direction
      if (this.state === State.ACTIVE) {
        const currentSlide = Math.floor(progress);
        this.gameState.addSliderEdge(this, time, currentSlide);
      }
    }

    this.position.copyFrom(position);
    this.lastTicks = ticks;
    this.lastForwards = forwards;

    return false;
  }

  private getHitResult(time: number) {
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
    if (this.state !== State.ACTIVE) {
      if (within(position, this.position, this.size / 2)) {
        this.state = State.ACTIVE;

        const result = this.getHitResult(time);
        if (this.headHit === 0 && result !== HitResultType.MISS) {
          // Slider head hit
          this.headHit = time;
          this.gameState.addSliderHead(result, this, time);
        }
      }
    } else {
      this.state = State.DOWN;
    }
  }

  move(time: number, position: PIXI.Point) {
    if (this.state === State.DOWN) {
      if (within(position, this.position, this.size / 2)) {
        // Re-enter slider
        this.state = State.ACTIVE;
      }
    } else if (
      this.state === State.ACTIVE &&
      !within(position, this.position, (FOLLOW_R * this.size) / 2)
    ) {
      // Leave slider
      this.state = State.DOWN;
    }
  }

  up(time: number, position: PIXI.Point) {
    this.state = State.NONE;
  }
}
