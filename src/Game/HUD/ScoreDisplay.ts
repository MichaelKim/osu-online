import * as PIXI from 'pixi.js';
import Skin from '../Skin';
import { clerp } from '../util';

const SCORE_DIGIT_WIDTH = 30;
const MAX_SCORE_DIGITS = 7;

export default class ScoreDisplay {
  // Graphics
  container: PIXI.Container = new PIXI.Container();
  sprites: PIXI.Sprite[] = [];

  // Score update
  updateTime = 0;
  targetScore = 0;
  visibleScore = 0;
  lastScore = 0;

  constructor(stage: PIXI.Container, private skin: Skin) {
    // Set to top-right
    const margin = window.innerWidth * 0.008;
    // TODO: update when window is resized
    this.container.position.set(window.innerWidth - margin, margin);

    const spriteHeight = skin.scores[0]?.height ?? 0;
    for (let i = 0; i < MAX_SCORE_DIGITS; i++) {
      const sprite = new PIXI.Sprite(skin.scores[0]);
      sprite.position.set(-(i + 0.5) * SCORE_DIGIT_WIDTH, spriteHeight);
      this.sprites.push(sprite);
      this.container.addChild(sprite);
    }

    stage.addChild(this.container);
  }

  setScore(score: number, time: number) {
    if (score !== this.targetScore) {
      this.lastScore = this.visibleScore;
      this.targetScore = score;
      this.updateTime = time;
    }
  }

  private setSprites(score: number) {
    this.visibleScore = score;

    const length = score === 0 ? 6 : Math.floor(Math.log10(score) + 1);
    for (let i = 0; i < length; i++) {
      const digit = Math.floor(score % 10);
      this.sprites[i].texture = this.skin.scores[digit] || PIXI.Texture.EMPTY;

      score /= 10;
    }

    for (let i = length; i < MAX_SCORE_DIGITS; i++) {
      this.sprites[i].texture = this.skin.scores[0] || PIXI.Texture.EMPTY;
    }
  }

  update(time: number) {
    if (this.lastScore !== this.targetScore) {
      const score = clerp(
        time - this.updateTime,
        0,
        1000,
        this.lastScore,
        this.targetScore
      );
      if (time - this.updateTime > 1000) {
        this.lastScore = this.targetScore;
      }
      this.setSprites(score);
    }
  }
}
