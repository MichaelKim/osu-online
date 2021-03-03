import * as PIXI from 'pixi.js';
import { IPointData } from '@pixi/math';
import { HitObjectTypes } from '.';
import { HitResultType } from '../HitResultController';
import {
  loadSpinnerSprites,
  SpinnerData,
  SpinnerSprites
} from '../Loader/SpinnerLoader';
import Skin from '../Skin';
import GameState from '../State/GameState';
import { clamp, clerp01, lerp } from '../util';

const SPINNER_FADE_OUT_MS = 150;
const TWO_PI = 2 * Math.PI;

// Keeps track of a rolling average rpm
interface SpinRecord {
  rotation: number; // Cumulative rotation made
  time: number;
}

const MAX_RECORD_DURATION = 595;

class SpinnerCounter {
  rpm = 0;
  private records: SpinRecord[] = [];

  addRecord(rotation: number, time: number) {
    // Remove old records
    if (this.records.length > 0) {
      // In case
      let r = this.records[0];
      while (this.records.length > 0 && time - r.time > MAX_RECORD_DURATION) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        r = this.records.shift()!;
      }

      this.rpm = Math.floor(
        (((rotation - r.rotation) / (time - r.time)) * 1000 * 60) / TWO_PI
      );
    }

    this.records.push({ rotation, time });
  }
}

export default class Spinner {
  readonly type = HitObjectTypes.SPINNER;

  // Sprites
  private s: SpinnerSprites;

  // Gameplay
  // All times are in ms (except for rpm) and angles are in radians
  private down = false; // Whether the spinner is held down or not
  private rotations = 0; // Number of rotations made so far
  private position: IPointData = { x: 0, y: 0 }; // Position of cursor
  private lastAngle = 0; // Angle of cursor last frame
  private lastTime = 0; // Time of last frame
  private currentRotations = 0; // Actual rotation of sprites (before dampen)
  private lastSpins = 0; // Rotations made last frame
  private counter: SpinnerCounter = new SpinnerCounter();

  // Rendering
  private drawnAngle = 0; // Sprite rotation
  private text: PIXI.Text = new PIXI.Text('', {
    fill: 0xffffff,
    fontSize: 24,
    align: 'center'
  });
  finished = 0;

  constructor(
    readonly o: SpinnerData,
    skin: Skin,
    private gameState: GameState
  ) {
    this.s = loadSpinnerSprites(this.o, skin);

    this.text.anchor.set(0.5);
    this.text.position.set(256, 356);
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.s.container, this.text);
  }

  setVisible(visible: boolean) {
    this.s.container.visible = visible;
    this.text.visible = visible;
  }

  get start() {
    return this.o.position;
  }

  get enter() {
    return this.o.t;
  }

  private getHitResult() {
    const progress = this.rotations / this.o.rotationsNeeded;
    if (progress >= 1) {
      return HitResultType.HIT300;
    }
    if (progress > 0.9) {
      return HitResultType.HIT100;
    }
    if (progress > 0.75) {
      return HitResultType.HIT50;
    }
    return HitResultType.MISS;
  }

  update(time: number) {
    // Always finished once endTime is reached
    if (time > this.o.endTime) {
      if (this.finished === 0) {
        // Just finished, get score
        this.finished = this.o.endTime;
        const result = this.getHitResult();
        this.gameState.addResult(result, this, time);
      }

      // Fade out
      const alpha = 1 - clerp01(time - this.o.endTime, 0, SPINNER_FADE_OUT_MS);
      this.s.container.alpha = alpha;
      this.text.alpha = alpha;

      return time > this.o.endTime + SPINNER_FADE_OUT_MS;
    }

    // Fade in
    if (time < this.o.t) {
      const alpha = clerp01(time - this.o.t - 150, 0, 150);
      this.s.container.alpha = alpha;
      this.text.alpha = alpha;
      return false;
    }

    this.s.container.alpha = 1;
    this.text.alpha = 1;

    // Calculate angle
    const angle = Math.atan2(
      this.position.y - this.o.position.y,
      this.position.x - this.o.position.x
    );

    if (this.down && time >= this.o.t && time <= this.o.t + this.o.endTime) {
      // Set angleDiff to [-pi, pi]
      let deltaAngle = angle - this.lastAngle;
      if (deltaAngle < -Math.PI) deltaAngle += TWO_PI;
      else if (deltaAngle > Math.PI) deltaAngle -= TWO_PI;

      this.currentRotations += deltaAngle;
      this.rotations += Math.abs(deltaAngle);
    }

    // Update counter
    this.counter.addRecord(this.rotations, time);

    // Get progress
    const spins = Math.floor(this.rotations / TWO_PI);
    while (this.lastSpins < spins) {
      if (this.lastSpins < this.o.rotationsNeeded) {
        // Regular tick
        this.gameState.addSpinnerTick(HitResultType.SPIN_TICK, this, time);
      } else {
        // Bonus tick
        this.gameState.addSpinnerTick(HitResultType.SPIN_BONUS, this, time);
      }
      this.lastSpins++;
    }

    // Update visible rotation
    const deltaTime = time - this.lastTime;
    this.drawnAngle = lerp(
      1 - Math.pow(0.99, deltaTime),
      0,
      1,
      this.drawnAngle,
      this.currentRotations
    );

    this.lastAngle = angle;
    this.lastTime = time;

    // Rotate sprites
    this.s.bottomSprite.rotation = this.drawnAngle / 7;
    this.s.topSprite.rotation = this.drawnAngle / 2;
    this.s.middle2Sprite.rotation = this.drawnAngle;

    const progress = clamp(this.rotations / this.o.rotationsNeeded, 0, 1);

    // Ease out from 1x to 1.25x
    const scale = 1 - 0.25 * progress * (progress - 2);
    this.s.container.scale.set(scale);

    // Tint middle sprite to red
    const red = (1 - progress) * 255;
    this.s.middleSprite.tint = 0xff0000 | (red << 8) | red;

    this.text.text = `${this.counter.rpm} RPM`;

    return false;
  }

  hit(time: number, position: IPointData) {
    this.down = true;
    this.position = position;
  }

  move(time: number, position: IPointData) {
    this.position = position;
  }

  up(time: number, position: IPointData) {
    this.down = false;
    this.position = position;
  }
}
