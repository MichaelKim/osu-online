import { Point } from '@pixi/math';
import { CursorType } from '../UI/options';
import Clock from './Clock';
import OptionsController from './OptionsController';
import { clamp } from './util';

export enum InputType {
  DOWN,
  UP,
  MOVE,
  SPACE
}

interface InputEvent {
  time: number;
  type: InputType;
  position: Point;
}

// Handles click / tap
export default class InputController {
  private position: Point;
  private numDown = 0; // Number of inputs currently pressing down
  events: InputEvent[] = [];

  // Needs clock to log input event timings
  constructor(private clock: Clock, private options: OptionsController) {
    this.position = new Point(window.innerWidth / 2, window.innerHeight / 2);
  }

  start() {
    window.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('mousedown', this.onDown);
    window.addEventListener('mouseup', this.onUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMove);
  }

  stop() {
    window.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('mousedown', this.onDown);
    window.removeEventListener('mouseup', this.onUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMove);
    this.events = [];
  }

  private onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private onKeyDown = (e: KeyboardEvent) => {
    // Ignore repeated events from holding key down
    if (e.repeat) return;
    if (
      e.key === this.options.options.leftButton ||
      e.key === this.options.options.rightButton
    ) {
      this.onDown();
    } else if (e.key === ' ') {
      this.events.push({
        time: this.clock.getTime(),
        type: InputType.SPACE,
        position: this.position
      });
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

  private getPosition(e: MouseEvent) {
    if (this.options.options.cursorType === CursorType.DEFAULT) {
      return {
        x: e.clientX,
        y: e.clientY
      };
    }

    const x = clamp(
      this.position.x + e.movementX * this.options.options.cursorSensitivity,
      0,
      window.innerWidth
    );
    const y = clamp(
      this.position.y + e.movementY * this.options.options.cursorSensitivity,
      0,
      window.innerHeight
    );
    return { x, y };
  }

  private onMove = (e: MouseEvent) => {
    this.position.copyFrom(this.getPosition(e));
    this.events.push({
      time: this.clock.getTime(),
      type: InputType.MOVE,
      position: this.position
    });
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (
      e.key === this.options.options.leftButton ||
      e.key === this.options.options.rightButton
    ) {
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
