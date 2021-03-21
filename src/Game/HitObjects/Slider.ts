import { Buffer } from '@pixi/core';
import { Container } from '@pixi/display';
import { IPointData, Point } from '@pixi/math';
import {
  APPROACH_R,
  FADE_OUT_MS,
  FOLLOW_R,
  HitObjectTypes,
  SLIDER_FADE_OUT_MS
} from '.';
import { pointAt } from '../Curve';
import { HitResultType } from '../HitResultController';
import { BeatmapData } from '../Loader/BeatmapLoader';
import {
  loadSliderSprites,
  SliderData,
  SliderSprites
} from '../Loader/SliderLoader';
import Skin from '../Skin';
import GameState from '../State/GameState';
import { arToMS, odToMS } from '../timing';
import { clamp, clerp, clerp01, within } from '../util';

// Number of points dividing a circle
const MAX_RES = 60;
const UNIT_CIRCLE = (() => {
  const vectors: IPointData[] = [];
  for (let i = 0; i < MAX_RES; i++) {
    const t = (i * 2 * Math.PI) / MAX_RES;
    vectors.push({
      x: Math.cos(t),
      y: Math.sin(t)
    });
  }
  return vectors;
})();

enum State {
  NONE,
  DOWN, // Cursor down, not in slider
  ACTIVE // Cursor down, slider active
}

export default class Slider {
  readonly type = HitObjectTypes.SLIDER;

  // Computed
  readonly fadeTime: number; // Starts to fade in
  readonly fullTime: number; // Fully opaque
  readonly hitWindows: {
    [HitResultType.HIT300]: number;
    [HitResultType.HIT100]: number;
    [HitResultType.HIT50]: number;
  };

  // Rendering
  s!: SliderSprites;
  private positionBuffer!: Buffer;
  private texPositionBuffer!: Buffer;
  private indexBuffer!: Buffer;

  // Gameplay
  finished!: number;
  private position!: Point; // Slider head position
  private headHit!: number; // When the slider head was hit (0 if not hit)
  private state!: State;
  private prevState!: State;
  private followTime!: number; // Animation for follow circle
  private lastProgress!: number; // Progress of last frame

  constructor(
    readonly o: SliderData,
    private beatmap: BeatmapData,
    private skin: Skin,
    private gameState: GameState
  ) {
    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(beatmap.ar);
    this.hitWindows = odToMS(beatmap.od);

    this.init();
  }

  init() {
    // Load sprites
    this.s = loadSliderSprites(this.o, this.beatmap, this.skin);
    this.setVisible(false);

    // Store buffers for quicker access during update
    this.positionBuffer = this.s.mesh.geometry.getBuffer('position');
    this.texPositionBuffer = this.s.mesh.geometry.getBuffer('tex_position');
    this.indexBuffer = this.s.mesh.geometry.getIndex();

    // Set initial position
    this.position = this.start;

    // Gameplay state
    this.finished = 0;
    this.headHit = 0;
    this.state = State.NONE;
    this.prevState = State.NONE;
    this.followTime = 0;
    this.lastProgress = 0;
  }

  get start() {
    const point = this.o.lines[0];
    return new Point(
      point.start.x + this.s.container.x,
      point.start.y + this.s.container.y
    );
  }

  get end() {
    const point = this.o.lines[this.o.lines.length - 1];
    return new Point(
      point.end.x + this.s.container.x,
      point.end.y + this.s.container.y
    );
  }

  get endTime() {
    return this.o.endTime;
  }

  addToStage(stage: Container) {
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

  private updateCap(
    center: Point,
    startTheta: number, // [-3pi/2, 3pi/2]
    endTheta: number, // [startTheta, startTheta + pi],
    vertices: number[],
    textureVertices: number[],
    centerIndex: number,
    startIndex: number,
    endIndex: number,
    indices: number[]
  ) {
    if (startTheta < 0) {
      startTheta += 2 * Math.PI; // [0, 2pi]
      endTheta += 2 * Math.PI;
    }

    if (endTheta < startTheta) {
      endTheta += 2 * Math.PI;
    }

    const startI = Math.ceil((startTheta * MAX_RES) / (2 * Math.PI));
    const endI = Math.ceil((endTheta * MAX_RES) / (2 * Math.PI));

    // Each triangle is composed of the center, and the two points along the circumference
    indices.push(centerIndex, startIndex);
    for (let i = startI; i < endI; i++) {
      const offset = UNIT_CIRCLE[i % MAX_RES];
      const x = center.x + (offset.x * this.o.size) / 2;
      const y = center.y + (offset.y * this.o.size) / 2;

      indices.push(textureVertices.length, centerIndex, textureVertices.length);
      vertices.push(x, y);
      textureVertices.push(0);
    }
    indices.push(endIndex);
  }

  private updateSlider(time: number) {
    const vertices: number[] = [];
    const textureVertices: number[] = [];
    const indices: number[] = [];

    // Slider end positions
    const [startT, endT] = this.calcIndices(time);
    const start = pointAt(this.o.lines, startT);
    const end = pointAt(this.o.lines, endT);

    vertices.push(start.point.x, start.point.y);
    textureVertices.push(1);

    // Draw quads
    for (let i = start.index; i <= end.index; i++) {
      const line = this.o.lines[i];
      // For each pair of points in the curve
      const p1 = i === start.index ? start.point : line.start;
      const p2 = i === end.index ? end.point : line.end;

      // Find the tangent to the line segment
      const offset = line.offset;

      // Extend length radius past each point along the tangent
      const v1x = p1.x - offset.x;
      const v1y = p1.y - offset.y;

      const v2x = p1.x + offset.x;
      const v2y = p1.y + offset.y;

      const v3x = p2.x - offset.x;
      const v3y = p2.y - offset.y;

      const v4x = p2.x + offset.x;
      const v4y = p2.y + offset.y;

      vertices.push(v1x, v1y, v2x, v2y, v3x, v3y, v4x, v4y, p2.x, p2.y);
      textureVertices.push(0, 0, 0, 0, 1);

      const j = (i - start.index) * 5;
      indices.push(j + 1, j, j + 3); // v1, p1, v3
      indices.push(j, j + 3, j + 5); // p1, v3, p2
      indices.push(j, j + 2, j + 4); // p1, v2, v4
      indices.push(j, j + 5, j + 4); // p1, p2, p4
    }

    for (let i = start.index; i < end.index; i++) {
      // Draw arc
      const line = this.o.lines[i];
      const nextLine = this.o.lines[i + 1];

      const j = (i - start.index) * 5;

      // Calculate direction using cross product
      const dx1 = line.end.x - line.start.x;
      const dy1 = line.end.y - line.start.y;
      const dx2 = nextLine.end.x - nextLine.start.x;
      const dy2 = nextLine.end.y - nextLine.start.y;
      const cross = dx1 * dy2 - dx2 * dy1;
      if (cross > 0) {
        // arc centered at l1.end from l1's v3 (l1.angle - Math.PI / 2) to l2's v1 (l2.angle - Math.PI / 2)
        this.updateCap(
          line.end,
          line.angle - Math.PI / 2,
          nextLine.angle - Math.PI / 2,
          vertices,
          textureVertices,
          j + 5, // p2
          j + 3, // v3
          j + 5 + 1, // l2's v1
          indices
        );
      } else {
        // arc centered at l1.end from l2's v2 (l2.angle + Math.PI / 2) to l1's v4 (l1.angle + Math.PI / 2)
        this.updateCap(
          line.end,
          nextLine.angle + Math.PI / 2,
          line.angle + Math.PI / 2,
          vertices,
          textureVertices,
          j + 5, // p2
          j + 5 + 2, // l2's v2
          j + 4, // v4
          indices
        );
      }
    }

    // Draw head
    const startLine = this.o.lines[start.index];
    this.updateCap(
      start.point,
      startLine.angle + Math.PI / 2,
      startLine.angle + (3 * Math.PI) / 2,
      vertices,
      textureVertices,
      0,
      2, // v2
      1, // v1
      indices
    );

    // Draw end
    const endLine = this.o.lines[end.index];
    const j = (end.index - start.index) * 5;
    this.updateCap(
      end.point,
      endLine.angle - Math.PI / 2,
      endLine.angle + Math.PI / 2,
      vertices,
      textureVertices,
      j + 5, // p2
      j + 3, // v3
      j + 4, // v4
      indices
    );

    // Update buffers
    this.positionBuffer.update(new Float32Array(vertices));
    this.texPositionBuffer.update(new Float32Array(textureVertices));
    this.indexBuffer.update(new Uint16Array(indices));
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
        this.gameState.addSliderEdge(this, time, this.o.slides);
      } else {
        this.gameState.missSliderEdge(this, time, this.o.slides);
      }
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
        (scale * this.o.size) / this.s.approachSprite.texture.width
      );

      return false;
    }

    this.s.container.alpha = 1;

    const progress = clamp(
      (time - this.o.t) / this.o.sliderTime,
      0,
      this.o.slides
    ); // Current repeat
    const forwards = Math.floor(progress) % 2 === 0; // Sliding direction
    const delta = forwards ? progress % 1 : 1 - (progress % 1); // [0, 1]
    this.position.copyFrom(pointAt(this.o.lines, delta).point);

    // Update hit circle
    if (this.headHit === 0 && this.getHitResult(time) !== HitResultType.MISS) {
      // Head can still be hit: hit circle follows slider ball
      this.s.circleSprite.position.copyFrom(this.position);
      this.s.numberSprites.position.copyFrom(this.position);
      this.s.approachSprite.position.copyFrom(this.position);
    } else if (this.headHit === 0) {
      // Head missed
      this.headHit = this.o.t + this.hitWindows[HitResultType.HIT50];
      this.gameState.addSliderHead(HitResultType.MISS, this, time);
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
        clerp(time - hitTime, 0, FADE_OUT_MS, 1, 1.6) * this.o.size;
      this.s.circleSprite.scale.set(circleSize / this.s.circleSprite.width);
    }

    // Update follow circle
    if (this.state !== this.prevState) {
      this.followTime = time;
    }
    this.s.followSprite.position.copyFrom(this.position);
    const t = clerp01(time - this.followTime, 0, 150);
    // If active, fade in, otherwise fade out
    const alpha = this.state === State.ACTIVE ? t : 1 - t;
    this.s.followSprite.alpha = alpha;
    const scale = clerp(alpha, 0, 1, 1, FOLLOW_R);
    this.s.followSprite.scale.set(
      (scale * this.o.size) / this.s.followSprite.texture.width
    );

    // Update slider ball
    const ballAlpha = clerp01(time - this.o.t, 0, 150);
    this.s.ballSprite.alpha = ballAlpha;
    this.s.ballSprite.position.copyFrom(this.position);

    // Update slider ticks
    this.s.tickSprites.forEach(t => {
      // Check for hit ticks
      if (t.progress > this.lastProgress && t.progress < progress) {
        // Tick's progress was between last frame and this frame
        if (this.state === State.ACTIVE) {
          t.hit = true;
          this.gameState.addSliderTick(this, time);
        } else {
          this.gameState.missSliderTick(this, time);
        }
      }

      t.update(time);
    });

    // Play slider end hit sound
    const lastForwards = Math.floor(this.lastProgress) % 2 === 0; // Slider direction last frame
    if (lastForwards !== forwards) {
      // Switched direction
      const currentSlide = Math.floor(progress);
      if (currentSlide >= 1 && currentSlide < this.o.slides) {
        if (this.state === State.ACTIVE) {
          this.gameState.addSliderEdge(this, time, currentSlide);
        } else {
          this.gameState.missSliderEdge(this, time, currentSlide);
        }
      }
    }

    // Store progress and state for next frame
    this.lastProgress = progress;
    this.prevState = this.state;

    if (this.finished > 0) {
      // Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, SLIDER_FADE_OUT_MS);
      this.s.container.alpha = alpha;

      const scale = clerp(
        time - this.finished,
        0,
        SLIDER_FADE_OUT_MS,
        FOLLOW_R,
        1
      );
      this.s.followSprite.scale.set(
        (scale * this.o.size) / this.s.followSprite.texture.width
      );

      return time > this.finished + SLIDER_FADE_OUT_MS;
    }

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

  hit(time: number, position: IPointData) {
    // Hitbox follows the slider head after slider starts
    if (this.state !== State.ACTIVE) {
      if (within(position, this.position, this.o.size / 2)) {
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

  move(time: number, position: IPointData) {
    if (this.state === State.DOWN) {
      if (within(position, this.position, this.o.size / 2)) {
        // Re-enter slider
        this.state = State.ACTIVE;
      }
    } else if (
      this.state === State.ACTIVE &&
      !within(position, this.position, (FOLLOW_R * this.o.size) / 2)
    ) {
      // Leave slider
      this.state = State.DOWN;
    }
  }

  up() {
    this.state = State.NONE;
  }
}
