import { Container } from '@pixi/display';
import { IPointData } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import Skin from './Skin';

export default class Cursor {
  private cursor: Sprite;

  constructor(stage: Container, skin: Skin) {
    this.cursor = new Sprite(skin.cursor);
    this.cursor.position.set(window.innerWidth / 2, window.innerHeight / 2);
    stage.addChild(this.cursor);
  }

  move(position: IPointData) {
    this.cursor.position.copyFrom(position);
  }

  getPosition() {
    return this.cursor.position;
  }

  hideCursor() {
    document.body.style.cursor = 'none';
  }

  showCursor() {
    document.body.style.cursor = 'auto';
  }
}
