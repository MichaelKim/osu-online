import * as PIXI from 'pixi.js';
import Clock from './Clock';
import { clamp } from './util';

export enum InputType {
  DOWN,
  UP,
  MOVE
}

interface InputEvent {
  time: number;
  type: InputType;
  position: PIXI.Point;
}

// Handles click / tap
export default class InputController {
  private position: PIXI.Point;
  key1 = '1';
  key2 = '2';
  cursorSensitivity: number = 2;
  private numDown: number = 0; // Number of inputs currently pressing down
  events: InputEvent[] = [];

  // Needs clock to log input event timings
  constructor(private clock: Clock) {
    this.position = new PIXI.Point(
      window.innerWidth / 2,
      window.innerHeight / 2
    );
  }

  start() {
    window.addEventListener('mousedown', this.onDown);
    window.addEventListener('mouseup', this.onUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMove);
  }

  stop() {
    window.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mouseup', this.onUp);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // Ignore repeated events from holding key down
    if (!e.repeat && (e.key === this.key1 || e.key === this.key2)) {
      this.onDown();
    }
  };

  private onDown = () => {
    this.numDown++;
    this.events.push({
      time: this.clock.getTime(),
      type: InputType.DOWN,
      position: this.position
    });
  };

  private onMove = (e: MouseEvent) => {
    const x = clamp(
      this.position.x + e.movementX * this.cursorSensitivity,
      0,
      window.innerWidth
    );
    const y = clamp(
      this.position.y + e.movementY * this.cursorSensitivity,
      0,
      window.innerHeight
    );

    this.position.set(x, y);
    this.events.push({
      time: this.clock.getTime(),
      type: InputType.MOVE,
      position: this.position
    });
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === this.key1 || e.key === this.key2) {
      this.onUp();
    }
  };

  private onUp = () => {
    this.numDown--;
    if (this.numDown === 0) {
      this.events.push({
        time: this.clock.getTime(),
        type: InputType.UP,
        position: this.position
      });
    }
  };
}
