import { Texture } from '@pixi/core';
import { Sprite } from '@pixi/sprite';
import { initSprite } from '../HitObjects';
import { BeatmapData } from '../Loader/BeatmapLoader';
import { SliderData } from '../Loader/SliderLoader';
import { arToMS } from '../timing';
import { clerp, clerp01, Tuple } from '../util';

// How long it takes to fade in
const FADE_MS = 100;

export default class ReverseArrow {
  start: Sprite;
  end: Sprite;
  fullTime: number;

  constructor(
    texture: Texture,
    private readonly o: SliderData,
    beatmap: BeatmapData
  ) {
    this.start = initSprite(texture, o.lines[0].start);
    this.start.rotation = o.lines[0].angle;
    this.start.alpha = 0;

    const endPosition = o.lines[o.lines.length - 1];
    this.end = initSprite(texture, endPosition.end);
    this.end.rotation = endPosition.angle + Math.PI;
    this.end.alpha = 0;

    this.fullTime = arToMS(beatmap.ar)[1];
  }

  private getAlphas(time: number): Tuple<number, 2> {
    // Fade in
    if (time < this.o.t) {
      return [0, clerp01(time - (this.o.t - this.fullTime), 0, FADE_MS)];
    }

    const progress = (time - this.o.t) / this.o.sliderTime; // Current repeat
    const forwards = Math.floor(progress) % 2 === 0; // Sliding direction

    // Show both
    if (progress + 2 < this.o.slides) {
      return [clerp01(time - this.o.t, 0, FADE_MS), 1];
    }

    // Third-last slide: show one, fade out other
    if (progress + 1 < this.o.slides) {
      const tt = this.o.t + (this.o.slides - 2) * this.o.sliderTime;
      const alpha = 1 - clerp01(time - tt, 0, FADE_MS);
      if (forwards) {
        return [alpha, 1];
      }
      return [1, alpha];
    }

    // Second-last slide: hide one, fade out other
    const tt = this.o.t + (this.o.slides - 1) * this.o.sliderTime;
    const alpha = 1 - clerp01(time - tt, 0, FADE_MS);
    if (forwards) {
      return [alpha, 0];
    }
    return [0, alpha];
  }

  update(time: number) {
    if (this.o.slides > 1) {
      // Pulses from 0.9 to 0.75 every 500ms
      const t = time % 500;
      const scale = clerp(t, 0, 500, 0.9, 0.75);
      this.start.scale.set(scale);
      this.end.scale.set(scale);

      [this.start.alpha, this.end.alpha] = this.getAlphas(time);
    }
  }
}
