import * as PIXI from 'pixi.js';
import Game from './Game';
import { Skin } from './Skin';
import { clamp } from './util';

// Handles cursor and click/tap
export default class InputController {
  game: Game;
  cursor: PIXI.Sprite;
  key1 = '1';
  key2 = '2';
  cursorSensitivity: number = 2;
  numDown: number = 0; // Number of inputs currently pressing down

  constructor(game: Game) {
    // Needs access to renderer (toOsuPixels) and
    // needs to send input events to game
    this.game = game;
  }

  loadTexture(skin: Skin) {
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

  onKeyDown = (e: KeyboardEvent) => {
    // Ignore repeated events from holding key down
    if (!e.repeat && (e.key === this.key1 || e.key === this.key2)) {
      this.onDown();
    }
  };

  onDown = () => {
    this.numDown++;
    const local = this.game.renderer.toOsuPixels(this.cursor.position);
    this.game.onDown(local);
  };

  onMove = (e: MouseEvent) => {
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
    const local = this.game.renderer.toOsuPixels(this.cursor.position);
    this.game.onMove(local);
  };

  onKeyUp = (e: KeyboardEvent) => {
    if (e.key === this.key1 || e.key === this.key2) {
      this.onUp();
    }
  };

  onUp = () => {
    this.numDown--;
    if (this.numDown === 0) {
      const local = this.game.renderer.toOsuPixels(this.cursor.position);
      this.game.onUp(local);
    }
  };
}
