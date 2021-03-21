import { Texture } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { rgb2hex } from '@pixi/utils';
import { pointAt } from '../Curve';
import { initSprite } from '../HitObjects';
import { SliderData } from '../Loader/SliderLoader';
import { clerp, clerp01 } from '../util';

const FADE_DURATION = 150;
const TICK_SIZE = 24;

export default class SliderTick {
  sprite: Sprite;

  progress: number;
  time: number; // Time when tick is hit
  fadeInTime: number;
  hit = false;

  constructor(
    texture: Texture,
    slider: SliderData,
    public tickPosition: number, // [0, 1] along slider from head to end
    slideIndex: number
  ) {
    const forwards = slideIndex % 2 === 0;
    const t = forwards ? tickPosition : 1 - tickPosition;
    const position = pointAt(slider.lines, t);

    this.sprite = initSprite(texture, position.point);
    this.sprite.alpha = 0;
    this.sprite.scale.set((0.5 * TICK_SIZE) / this.sprite.texture.width);

    // For repeat slides, use a shorter delay for better visual clarity
    const offset = slideIndex > 0 ? 200 : 400 * 0.66;

    this.progress = slideIndex + tickPosition;
    this.time = slider.t + slider.sliderTime * this.progress;
    const spanStartTime = slider.t + slider.sliderTime * slideIndex;
    const preempt = (this.time - spanStartTime) / 2 + offset;
    this.fadeInTime = this.time - preempt;
  }

  update(time: number) {
    if (time < this.fadeInTime) return false;

    // [fade in, +150]: fade in
    // [fade in, +600]: scale 0.5 to 1
    if (time < this.time) {
      const alpha = clerp01(time - this.fadeInTime, 0, FADE_DURATION);
      this.sprite.alpha = alpha;

      const scale = clerp(time - this.fadeInTime, 0, FADE_DURATION, 0.5, 1);
      this.sprite.scale.set((scale * TICK_SIZE) / this.sprite.texture.width);

      return false;
    }

    // [t, +150]: fade out
    const alpha = 1 - clerp01(time - this.time, 0, FADE_DURATION);
    this.sprite.alpha = alpha;

    if (this.hit) {
      // [t, +150]: scale from 1 to 1.5
      const scale = clerp(time - this.time, 0, FADE_DURATION, 1, 1.5);
      this.sprite.scale.set((scale * TICK_SIZE) / this.sprite.texture.width);
    } else {
      // [t, +75]: tint from none to red
      const t = 1 - clerp01(time - this.time, 0, FADE_DURATION / 2);
      const tint = rgb2hex([1, t, t]);
      this.sprite.tint = tint;
    }

    return time > this.time + FADE_DURATION;
  }
}
