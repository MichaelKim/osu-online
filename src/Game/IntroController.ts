import { Container } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { Text } from '@pixi/text';
import Renderer from './Renderer';
import { clerp } from './util';

export const INTRO_TIME = 2000; // Extra time before audio starts
export const MIN_INTRO_SKIP = 5000; // Minimum delay to first note required for skip

export default class IntroController {
  private container = new Container();
  private bar = new Graphics();
  private startTime = 0;

  private width = 0;
  private height = 0;

  constructor(renderer: Renderer) {
    const text = new Text('Press space to skip', {
      fontSize: 50,
      fill: '#ffcc22',
      fontFamily: 'Exo 2'
    });
    text.anchor.set(0.5);

    this.container.addChild(text, this.bar);
    this.container.visible = false;

    renderer.resumeStage.addChild(this.container);

    renderer.onResize((width, height) => {
      text.position.set(width / 2, height / 2);
      this.width = width;
      this.height = height;
    });
  }

  showIntro(startTime: number) {
    this.container.visible = true;
    this.startTime = startTime;
  }

  space(time: number) {
    if (this.container.visible && time < this.startTime - INTRO_TIME) {
      this.container.visible = false;
      return true;
    }

    return false;
  }

  update(time: number) {
    const visible = time < this.startTime - INTRO_TIME;
    this.container.visible = visible;

    if (visible) {
      const progress = clerp(
        time,
        -INTRO_TIME,
        this.startTime - INTRO_TIME,
        this.width,
        0
      );

      this.bar
        .clear()
        .lineStyle(10, 0xffcc22)
        .drawRect(
          (this.width - progress) / 2,
          (this.height * 2) / 3,
          progress,
          1
        );
    }
  }
}
