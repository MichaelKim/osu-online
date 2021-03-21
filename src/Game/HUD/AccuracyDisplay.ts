import { Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Sprite } from '@pixi/sprite';
import Renderer from '../Renderer';
import Skin from '../Skin';

const SCORE_DIGIT_WIDTH = 30;

export default class AccuracyDisplay {
  // Graphics
  container = new Container();
  sprites: Sprite[] = [];

  constructor(renderer: Renderer, private skin: Skin) {
    const spriteHeight = skin.scores[0]?.height ?? 0;
    for (let i = 0; i < 7; i++) {
      const sprite = new Sprite(skin.scores[0]);
      sprite.position.set((i + 0.5) * SCORE_DIGIT_WIDTH, spriteHeight);
      this.sprites.push(sprite);
      this.container.addChild(sprite);
    }

    this.sprites[0].texture = skin.scores[1] ?? Texture.EMPTY;
    this.sprites[3].texture = skin.scoreDot ?? Texture.EMPTY;
    this.sprites[6].texture = skin.scorePercent ?? Texture.EMPTY;

    renderer.displayStage.addChild(this.container);
    renderer.onResize(width => {
      // Set to top-right
      const margin = width * 0.008;
      this.container.position.set(width / 2, margin);
    });
  }

  setAccuracy(accuracy: number) {
    console.log(Math.round(accuracy * 10000) / 100);
    this.sprites[0].visible = accuracy >= 1;

    let digits = Math.round(accuracy * 10000); // 4 digits

    const d5 = digits % 10 | 0;
    digits /= 10;
    const d4 = digits % 10 | 0;
    digits /= 10;
    const d2 = digits % 10 | 0;
    digits /= 10;
    const d1 = digits % 10 | 0;
    console.log(digits, [d1, d2, d4, d5]);

    this.sprites[5].texture = this.skin.scores[d5] ?? Texture.EMPTY;
    this.sprites[4].texture = this.skin.scores[d4] ?? Texture.EMPTY;
    this.sprites[2].texture = this.skin.scores[d2] ?? Texture.EMPTY;
    this.sprites[1].texture = this.skin.scores[d1] ?? Texture.EMPTY;
  }

  reset() {
    this.setAccuracy(1);
  }
}
