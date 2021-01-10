import * as PIXI from 'pixi.js';
import Clock from './Clock';
import { Skin } from './Skin';
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

// Handles cursor and click/tap
export default class InputController {
  clock: Clock;
  cursor: PIXI.Sprite;
  key1 = '1';
  key2 = '2';
  cursorSensitivity: number = 2;
  numDown: number = 0; // Number of inputs currently pressing down

  events: InputEvent[] = [];

  constructor(clock: Clock) {
    // Needs clock to log input event timings
    this.clock = clock;
  }

  loadTexture(skin: Skin) {
    // this.cursor?.destroy();
    this.cursor = new PIXI.Sprite(skin.cursor);
    this.cursor.position.set(window.innerWidth / 2, window.innerHeight / 2);
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
      position: this.cursor.position
    });
  };

  private onMove = (e: MouseEvent) => {
    const x = clamp(
      this.cursor.x + e.movementX * this.cursorSensitivity,
      0,
      window.innerWidth
    );
    const y = clamp(
      this.cursor.y + e.movementY * this.cursorSensitivity,
      0,
      window.innerHeight
    );

    this.cursor.position.set(x, y);
    this.events.push({
      time: this.clock.getTime(),
      type: InputType.MOVE,
      position: this.cursor.position
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
        position: this.cursor.position
      });
    }
  };
}
