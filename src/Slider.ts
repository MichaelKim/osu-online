import * as PIXI from 'pixi.js';
import Beatmap from './Beatmap';
import {
  APPROACH_R,
  FADE_OUT_MS,
  FOLLOW_R,
  HitObjectTypes,
  STACK_OFFSET_MULT
} from './HitObjects';
import HitSoundController, {
  BaseHitSound,
  SliderHitSound
} from './HitSoundController';
import {
  loadSliderSprites,
  parseSlider,
  SliderData,
  SliderSprites
} from './Loader/SliderLoader';
import { Skin } from './Skin';
import { arToMS, csToSize } from './timing';
import TimingPoint from './TimingPoint';
import { clerp, clerp01 } from './util';

export default class Slider {
  readonly type = HitObjectTypes.SLIDER;

  o: SliderData;

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  size: number; // Diameter of hit circle

  // Rendering
  container: PIXI.Container;
  graphics: PIXI.Graphics;
  s: SliderSprites;

  // Gameplay
  position: PIXI.Point;
  finished = 0;
  active = false; // Is the slider being followed?
  ticksHit = 0; // Number of slider ticks already hit (per repeat)
  repeatsHit = 0; // Number of repeats (incl. slider ends) hit
  hitSoundController: HitSoundController;

  constructor(
    tokens: string[],
    comboNumber: number,
    comboIndex: number,
    beatmap: Beatmap,
    timingPoint: TimingPoint,
    skin: Skin,
    hitSoundController: HitSoundController
  ) {
    this.o = parseSlider(tokens, comboNumber, comboIndex, timingPoint, beatmap);
    this.position = this.start;

    this.hitSoundController = hitSoundController;

    // Compute timing windows
    [this.fadeTime, this.fullTime] = arToMS(beatmap.ar);
    this.size = csToSize(beatmap.cs);

    this.s = loadSliderSprites(this.o, skin, this.size);
    this.graphics = new PIXI.Graphics();

    this.container = new PIXI.Container();
    this.container.visible = false;
    this.container.addChild(
      this.graphics,
      ...this.s.tickSprites,
      this.s.reverseSprite,
      this.s.circleSprite,
      this.s.followSprite,
      this.s.numberSprites,
      this.s.approachSprite
    );
  }

  set stackCount(stack: number) {
    // Stack offset
    const offset = (stack * this.size) / STACK_OFFSET_MULT;
    this.container.position.set(offset);
  }

  get start() {
    return new PIXI.Point(this.o.x, this.o.y);
  }

  get end() {
    return this.o.curve[this.o.curve.length - 1];
  }

  get endTime() {
    return this.o.endTime;
  }

  addToStage(stage: PIXI.Container) {
    stage.addChild(this.container);
  }

  setVisible(visible: boolean) {
    this.container.visible = visible;
  }

  // Returns [start, end]
  calcIndices(time: number) {
    // One less slide
    const outTime = this.o.endTime - this.o.sliderTime;

    // Snake in: [t - fade, t - full] -> [0, 1]
    // TODO: this still feels too late
    if (time < this.o.t - this.fullTime) {
      return [
        0,
        clerp01(time, this.o.t - this.fadeTime, this.o.t - this.fullTime)
      ];
    }

    // Full slider
    if (time < outTime) {
      return [0, 1];
    }

    // Snake out: [t + sliderTime * (slides - 1), t + sliderTime * slides] -> [0, 1]
    if (time < this.o.endTime) {
      // Odd number of slides: start moves in
      if (this.o.slides % 2) {
        return [clerp01(time, outTime, this.o.endTime), 1];
      }

      // Even slides: end moves in
      return [0, 1 - clerp01(time, outTime, this.o.endTime)];
    }

    // Slider finished
    return [0, 0];
  }

  updateSlider(time: number) {
    const [start, end] = this.calcIndices(time);

    // TODO: change to curve pointAt
    const startIndex = Math.floor(this.o.curve.length * start);
    const endIndex = Math.floor(this.o.curve.length * end);

    this.graphics.clear();
    this.graphics.lineStyle(5, 0xffffff);
    this.graphics.moveTo(
      this.o.curve[startIndex].x,
      this.o.curve[startIndex].y
    );
    for (let i = startIndex + 1; i < endIndex; i++) {
      this.graphics.lineTo(this.o.curve[i].x, this.o.curve[i].y);
    }
  }

  playEdge(index: number) {
    const hitSound = this.o.edgeSounds[index] || this.o.hitSound;
    // [normal, addition]
    const setIndex = hitSound === BaseHitSound.NORMAL ? 0 : 1;
    const sampleSet = this.o.edgeSets[index]?.[setIndex] || this.o.sampleSet;
    this.hitSoundController.playBaseSound(sampleSet, hitSound);
  }

  update(time: number) {
    if (this.finished > 0) {
      // Fade out everything
      const alpha = 1 - clerp01(time - this.finished, 0, FADE_OUT_MS);
      this.container.alpha = alpha;

      return time > this.finished + FADE_OUT_MS;
    }

    // Not visible yet
    if (time < this.o.t - this.fadeTime) {
      return false;
    }

    this.updateSlider(time);

    // Fade in
    if (time < this.o.t) {
      const alpha = clerp01(
        time,
        this.o.t - this.fadeTime,
        this.o.t - this.fullTime
      );
      this.container.alpha = alpha;

      // Slider
      this.s.followSprite.alpha = 0;
      this.s.reverseSprite.alpha = 0;

      // Update approach circle sizes
      const size =
        this.size *
        clerp(time, this.o.t - this.fadeTime, this.o.t, APPROACH_R, 1);
      this.s.approachSprite.scale.set(
        size / this.s.approachSprite.texture.width
      );

      // Reverse arrow
      if (this.o.slides > 1) {
        this.s.reverseSprite.alpha = clerp01(
          time,
          this.o.t - this.fullTime,
          this.o.t - this.fullTime + 100
        );
      }
      return false;
    }

    // Slider active
    // Check if slider is finished
    if (this.active && time > this.o.endTime) {
      this.finished = time;

      // Play slider end hit sound
      this.playEdge(this.o.edgeSounds.length - 1);

      return false;
    }

    // Update slider ball
    const progress = (time - this.o.t) / this.o.sliderTime; // Current repeat
    const forwards = Math.floor(progress) % 2 === 0; // Sliding direction
    const delta = forwards ? progress % 1 : 1 - (progress % 1);
    // TODO: use pointAt
    const curveIndex = Math.floor(this.o.curve.length * delta);
    const position = this.o.curve[curveIndex];

    const alpha =
      1 - clerp01(time - this.o.t, 0, this.fadeTime - this.fullTime);
    this.container.alpha = 1;

    // Fade out hit circle, combo number, approach circle
    // TODO: these might actually instantly fade out once hit
    this.s.circleSprite.alpha = alpha;
    this.s.circleSprite.position.copyFrom(position);

    this.s.numberSprites.alpha = alpha;
    this.s.numberSprites.position.copyFrom(position);

    this.s.approachSprite.alpha = alpha;
    this.s.approachSprite.position.copyFrom(position);

    // Fade in follow circle
    this.s.followSprite.alpha = clerp01(time - this.o.t, 0, 150);
    this.s.followSprite.position.copyFrom(position);
    // Expand follow circle
    const size = this.size * clerp(time - this.o.t, 0, 150, 1, FOLLOW_R);
    this.s.followSprite.scale.set(size / this.s.followSprite.texture.width);

    // Update slider ticks
    let tickStart = 0,
      tickEnd = 1;
    if (forwards) {
      tickStart = delta;
    } else {
      tickEnd = delta;
    }
    let ticksHitNew = 0;
    for (let i = 0; i < this.o.ticks.length; i++) {
      // TODO: ticks are evenly spaced, so [0, end] -> [length - end, 1] is more efficient
      if (this.o.ticks[i] > tickStart && this.o.ticks[i] < tickEnd) {
        // TODO: fade in and pop out
        this.s.tickSprites[i].alpha = 1;
      } else {
        this.s.tickSprites[i].alpha = 0;
        ticksHitNew++;
      }
    }

    // Play tick hit sound
    if (this.active) {
      for (let i = this.ticksHit; i < ticksHitNew; i++) {
        // Number of ticks hit increased: new ticks
        this.hitSoundController.playSound(
          this.o.sampleSet,
          SliderHitSound.SLIDER_TICK
        );
      }
    }
    this.ticksHit = ticksHitNew;

    // Play slider end hit sound
    if (this.active) {
      const currentSlide = Math.floor(progress);
      if (this.repeatsHit !== currentSlide) {
        this.playEdge(currentSlide);
        this.repeatsHit = currentSlide;
      }
    }

    // TODO
    this.position.copyFrom(position);

    return false;
  }

  hit(position: PIXI.Point) {
    // TODO: should this be two separate methods?
    if (this.active) {
      // TODO: use within()
      const dx = position.x - this.position.x;
      const dy = position.y - this.position.y;
      // Once active, cursor needs to stay within follow circle
      const r = (FOLLOW_R * this.size) / 2;
      return dx * dx + dy * dy < r * r;
    }

    const dx = position.x - this.start.x;
    const dy = position.y - this.start.y;
    const r = this.size / 2;
    return dx * dx + dy * dy < r * r;
  }
}
