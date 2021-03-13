import { Container } from '@pixi/display';
import { IPointData } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { Text } from '@pixi/text';
import Renderer from './Renderer';
import Skin from './Skin';
import { within } from './util';

export default class ResumeController {
  private cursor: Sprite;
  private container = new Container();

  constructor(renderer: Renderer, skin: Skin) {
    this.cursor = new Sprite(skin.cursor);
    this.cursor.tint = 0xfca300;

    const text = new Text('Click the orange cursor to resume', {
      fontSize: 50,
      fill: 'orange',
      fontFamily: 'Exo 2'
    });
    text.anchor.set(0.5);

    this.container.addChild(text, this.cursor);
    this.container.visible = false;

    renderer.resumeStage.addChild(this.container);

    renderer.onResize((width, height) => {
      text.position.set(width / 2, height / 2);
    });
  }

  pause(position: IPointData) {
    this.cursor.position.copyFrom(position);
    this.container.visible = false;
  }

  startResume() {
    this.container.visible = true;
  }

  endResume() {
    this.container.visible = false;
  }

  isResuming() {
    return this.container.visible;
  }

  within(position: IPointData) {
    return within(position, this.cursor.position, this.cursor.width / 2);
  }
}
