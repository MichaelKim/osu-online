import * as PIXI from 'pixi.js';
import Skin from './Skin';

export default class Cursor {
  private cursor: PIXI.Sprite;

  constructor(stage: PIXI.Container, skin: Skin) {
    this.cursor = new PIXI.Sprite(skin.cursor);
    this.cursor.position.set(window.innerWidth / 2, window.innerHeight / 2);
    stage.addChild(this.cursor);
  }

  move(position: PIXI.Point) {
    this.cursor.position.copyFrom(position);
  }
}
