import * as PIXI from 'pixi.js';
import { HitObjectTypes } from '.';
import {
  loadSpinnerSprites,
  SpinnerData,
  SpinnerSprites
} from '../Loader/SpinnerLoader';
import { Skin } from '../Skin';
import { clamp, clerp, clerp01 } from '../util';

const SPINNER_FADE_OUT_MS = 150;
const DELTA_UPDATE_TIME = 1000 / 60;
const MAX_ANGLE_DIFF = 5 / 6;
const TWO_PI = 2 * Math.PI;

export default class Spinner {
  readonly type = HitObjectTypes.SPINNER;

  // Sprites
  private container: PIXI.Container = new PIXI.Container();
  private s: SpinnerSprites;

  // Gameplay
  // All times are in ms (except for rpm) and angles are in radians
  private down: boolean = false; // Whether the spinner is held down or not
  private lastAngle: number = 0; // Angle of cursor last frame
  private lastTime: number = 0; // Time of last frame
  private deltaAngleOverflow: number = 0; // Unprocessed delta angle
  private deltaTimeOverflow: number = 0; // Unprocessed time
  private storedDeltaAngle: number[] = []; // Ring buffer of previous angles
  private sumDeltaAngle: number = 0; // Sum of storedDeltaAngle
  private deltaAngleIndex: number = 0; // Latest index in storedDeltaAngle
  private rotations: number = 0; // Number of rotations made so far

  // Rendering
  private drawnRPM: number = 0; // Displayed RPM
  private drawnAngle: number = 0; // Sprite rotation
  private text: PIXI.Text = new PIXI.Text('', {
    fill: 0xffffff,
    fontSize: 24,
    align: 'center'
  });
  finished: number = 0;

  constructor(readonly o: SpinnerData, skin: Skin) {
    this.s = loadSpinnerSprites(this.o, skin);
    this.container.visible = false;
    this.container.addChild(
      this.s.glowSprite,
      this.s.bottomSprite,
      this.s.topSprite,
      this.s.middle2Sprite,
      this.s.middleSprite
    );
    this.container.position.copyFrom(this.o.position);

    this.text.anchor.set(0.5);
    this.text.position.set(256, 356);

    const minVel = 12;
    const maxVel = 48;
    const minTime = 2000;
    const maxTime = 5000;
    const maxStoredDeltaAngles = Math.floor(
      clerp(this.o.endTime - this.o.t, minTime, maxTime, minVel, maxVel)
    );
    this.storedDeltaAngle = new Array(maxStoredDeltaAngles).fill(0);
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.container, this.text);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
    this.text.visible = visible;
  }

  get enter() {
    return this.o.t;
  }

  update(time: number) {
    // Always finished once endTime is reached
    if (time > this.o.endTime) {
      this.finished = this.o.endTime;
      const alpha = 1 - clerp01(time - this.o.endTime, 0, SPINNER_FADE_OUT_MS);
      this.container.alpha = alpha;
      this.text.alpha = alpha;

      return time > this.o.endTime + SPINNER_FADE_OUT_MS;
    }

    // Too early
    if (time < this.o.t - 150) {
      return false;
    }

    // Fade in
    if (time < this.o.t) {
      const alpha = clerp01(time - this.o.t - 150, 0, 150);
      this.container.alpha = alpha;
      this.text.alpha = alpha;
      return false;
    }

    this.container.alpha = 1;
    this.text.alpha = 1;

    // Update elapsed time
    this.deltaTimeOverflow += time - this.lastTime;
    this.lastTime = time;

    while (this.deltaTimeOverflow >= DELTA_UPDATE_TIME) {
      // Calculate angle moved
      const deltaAngle = clamp(
        (this.deltaAngleOverflow * DELTA_UPDATE_TIME) / this.deltaTimeOverflow,
        -MAX_ANGLE_DIFF,
        MAX_ANGLE_DIFF
      );
      // Remove from overflow
      this.deltaAngleOverflow -= deltaAngle;
      this.deltaTimeOverflow -= DELTA_UPDATE_TIME;
      // Update sum
      this.sumDeltaAngle +=
        deltaAngle - this.storedDeltaAngle[this.deltaAngleIndex];
      this.storedDeltaAngle[this.deltaAngleIndex] = deltaAngle;
      this.deltaAngleIndex =
        (this.deltaAngleIndex + 1) % this.storedDeltaAngle.length;

      // Calculate rolling window angle
      const rotationAngle = clamp(
        this.sumDeltaAngle / this.storedDeltaAngle.length,
        -MAX_ANGLE_DIFF,
        MAX_ANGLE_DIFF
      );
      const rotationPerSec =
        (rotationAngle * (1000 / DELTA_UPDATE_TIME)) / TWO_PI;

      this.drawnRPM = Math.floor(Math.abs(rotationPerSec * 60));

      // Rotate
      this.drawnAngle += rotationAngle;
      const newRotations = this.rotations + Math.abs(rotationAngle) / TWO_PI;
      if (Math.floor(newRotations) > this.rotations) {
        if (newRotations > this.o.rotationsNeeded) {
          console.log('bonus rotation');
          // TODO: flash spinner-glow
        } else {
          console.log('new rotation');
        }
      }

      this.rotations = newRotations;
    }

    // Rotate sprites
    this.s.bottomSprite.rotation = this.drawnAngle / 7;
    this.s.topSprite.rotation = this.drawnAngle / 2;
    this.s.middle2Sprite.rotation = this.drawnAngle;

    const progress = clamp(this.rotations / this.o.rotationsNeeded, 0, 1);

    // Ease out from 1x to 1.25x
    const scale = 1 - 0.25 * progress * (progress - 2);
    this.container.scale.set(scale);

    // Tint middle sprite to red
    const red = (1 - progress) * 255;
    this.s.middleSprite.tint = 0xff0000 | (red << 8) | red;

    this.text.text = `${this.drawnRPM} RPM`;

    return false;
  }

  hit(time: number, position: PIXI.Point) {
    this.down = true;
    this.lastTime = time;
    this.lastAngle = Math.atan2(
      position.y - this.o.position.y,
      position.x - this.o.position.x
    );
  }

  move(time: number, position: PIXI.Point) {
    if (!this.down) return;

    const angle = Math.atan2(
      position.y - this.o.position.y,
      position.x - this.o.position.x
    );

    // Set angleDiff to [-pi, pi]
    let angleDiff = angle - this.lastAngle;
    if (angleDiff < -Math.PI) angleDiff += TWO_PI;
    else if (angleDiff > Math.PI) angleDiff -= TWO_PI;

    // Collect new angle movement
    this.deltaTimeOverflow += time - this.lastTime;
    this.deltaAngleOverflow += angleDiff;

    this.lastAngle = angle;
    this.lastTime = time;
  }

  up(time: number, position: PIXI.Point) {
    this.down = false;
  }
}
