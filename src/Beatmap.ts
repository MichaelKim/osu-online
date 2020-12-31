import * as PIXI from 'pixi.js';
import * as AudioLoader from './AudioLoader';
import HitCircle from './HitCircle';
import { ObjectTypes } from './HitObjects';
import HitResultController, { HitResultType } from './HitResultController';
import HitSoundController from './HitSoundController';
import { SampleSetType } from './SampleSet';
import { Skin } from './Skin';
import { Slider } from './Slider';
import { arToMS, odToMS } from './timing';
import TimingPoint from './TimingPoint';
import { distSqr } from './util';

const STACK_LENIENCE_SQR = 3 * 3;

type HitObject = HitCircle | Slider;

export default class Beatmap {
  filepath: string; // Path to .osu file

  // general
  version: number = 14;
  audioFilename: string;
  audioLeadIn: number = 0;
  sampleSet: SampleSetType = SampleSetType.NORMAL;
  stackLeniency: number = 0.7;

  // difficulty
  cs: number;
  od: number;
  ar: number = 5;
  sliderMultiplier: number = 1.4;
  sliderTickRate: number = 1;

  timingPoints: TimingPoint[] = [];
  notes: HitObject[] = [];

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  hitWindows: {
    [HitResultType.HIT300]: number;
    [HitResultType.HIT100]: number;
    [HitResultType.HIT50]: number;
  };

  // Gameplay
  hitResult: HitResultController;
  hitSound: HitSoundController;
  left: number;
  right: number;
  music: HTMLAudioElement;

  constructor(
    filepath: string,
    hitResult: HitResultController,
    hitSound: HitSoundController
  ) {
    this.filepath = filepath;
    this.hitResult = hitResult;
    this.hitSound = hitSound;
  }

  async readFile() {
    const res = await fetch(this.filepath);
    const text = await res.text();
    return text.split('\n').map(l => l.trim());
  }

  async parseFile() {
    const file = await this.readFile();

    let i = 0;

    function readKeyValue() {
      const line = file[i++];
      const split = line.indexOf(':');
      const key = line.slice(0, split).trim();
      const value = line.slice(split + 1).trim();
      return [key, value];
    }

    while (i < file.length) {
      switch (file[i++]) {
        case '[General]':
          while (i < file.length && file[i][0] !== '[' && file[i].length > 0) {
            const [key, value] = readKeyValue();
            switch (key) {
              case 'AudioFilename':
                this.audioFilename = value;
                break;
              case 'AudioLeadIn':
                this.audioLeadIn = parseInt(value);
                break;
              case 'SampleSet':
                switch (value) {
                  case 'Normal':
                    this.sampleSet = SampleSetType.NORMAL;
                    break;
                  case 'Soft':
                    this.sampleSet = SampleSetType.SOFT;
                    break;
                  case 'Drum':
                    this.sampleSet = SampleSetType.DRUM;
                    break;
                }
              case 'StackLeniency':
                this.stackLeniency = parseFloat(value);
                break;
            }
          }
          break;
        case '[Difficulty]':
          while (i < file.length && file[i][0] !== '[' && file[i].length > 0) {
            const [key, value] = readKeyValue();
            switch (key) {
              case 'CircleSize':
                this.cs = parseFloat(value);
                break;
              case 'OverallDifficulty':
                this.od = parseFloat(value);
                break;
              case 'ApproachRate':
                this.ar = parseFloat(value);
                break;
              case 'SliderMultiplier':
                this.sliderMultiplier = parseFloat(value);
                break;
              case 'SliderTickRate':
                this.sliderTickRate = parseFloat(value);
                break;
            }
          }
          break;
        case '[TimingPoints]':
          while (i < file.length && file[i][0] !== '[' && file[i].length > 0) {
            const tokens = file[i++].split(',');
            this.timingPoints.push(new TimingPoint(tokens));
          }
          break;
        case '[HitObjects]':
          // Parse hit objects later
          while (i < file.length && file[i][0] !== '[' && file[i].length > 0) {
            i++;
          }
          break;
      }
    }
  }

  async preload() {
    await this.parseFile();

    [this.fadeTime, this.fullTime] = arToMS(this.ar);
    this.hitWindows = odToMS(this.od);
  }

  async parseHitObjects() {
    let comboNumber = 0;
    let comboIndex = 0;

    let timingIndex = -1;
    let baseBeatLength = 1,
      beatLength = 1;

    const file = await this.readFile();

    for (
      let i = file.indexOf('[HitObjects]') + 1;
      i < file.length && file[i][0] !== '[' && file[i].length > 0;
      i++
    ) {
      const tokens = file[i].split(',');
      if (tokens.length < 4) {
        console.error(`Line ${i} missing tokens`);
        continue;
      }

      const type = parseInt(tokens[3]);

      // Calculate combo number
      if (type & ObjectTypes.NEW_COMBO) {
        // New combo
        comboNumber = 1;

        const skip = (type & ObjectTypes.COMBO_SKIP) >> 4;
        comboIndex += skip;
      } else {
        comboNumber++;
      }

      // Update latest point
      // TODO: alternative is to make a pass through timing points and
      // calculate beat length for each point in advance
      const t = parseInt(tokens[2]);
      while (
        timingIndex + 1 < this.timingPoints.length &&
        this.timingPoints[timingIndex + 1].time <= t
      ) {
        timingIndex++;
        // Calculate beat length
        if (this.timingPoints[timingIndex].inherited) {
          beatLength = baseBeatLength * this.timingPoints[timingIndex].mult;
        } else {
          baseBeatLength = beatLength = this.timingPoints[timingIndex]
            .beatLength;
        }
      }
      const timingPoint = this.timingPoints[timingIndex - 1];

      if (type & ObjectTypes.HIT_CIRCLE) {
        const circle = new HitCircle(
          tokens,
          comboNumber,
          comboIndex,
          timingPoint.sampleSet || this.sampleSet
        );

        this.notes.push(circle);
      } else if (type & ObjectTypes.SLIDER) {
        const slider = new Slider(
          tokens,
          comboNumber,
          comboIndex,
          timingPoint.sampleSet || this.sampleSet,
          this.hitSound
        );

        // Calculate slider duration
        slider.sliderTime =
          (beatLength * (slider.length / this.sliderMultiplier)) / 100;

        // Commonly computed value
        slider.endTime = slider.t + slider.sliderTime * slider.slides;

        // Calculate slider ticks
        const tickDist =
          (100 * this.sliderMultiplier) /
          this.sliderTickRate /
          timingPoint.mult;
        const numTicks = Math.ceil(slider.length / tickDist) - 2; // Ignore start and end
        if (numTicks > 0) {
          const tickOffset = 1 / (numTicks + 1);
          for (let i = 0, t = tickOffset; i < numTicks; i++, t += tickOffset) {
            slider.ticks.push(t);
          }
        }

        this.notes.push(slider);
      }
    }
  }

  // Taken from https://gist.github.com/peppy/1167470
  calcStacking() {
    const [fadeTime] = arToMS(this.ar);
    // Reverse pass
    for (let i = this.notes.length - 1; i > 0; i--) {
      let objectI = this.notes[i];

      // Already done
      if (objectI.stackCount !== 0 || objectI.type === ObjectTypes.SPINNER) {
        continue;
      }

      // Search for any stacking
      for (let n = i - 1; n >= 0; n--) {
        const objectN = this.notes[n];
        if (objectN.type === ObjectTypes.SPINNER) {
          continue;
        }

        const endTime =
          objectN.type === ObjectTypes.SLIDER
            ? (objectN as Slider).endTime
            : objectN.t;
        if (objectI.t - fadeTime * this.stackLeniency > endTime) {
          break;
        }

        // Reverse stacking
        if (objectN.type === ObjectTypes.SLIDER) {
          const slider = objectN as Slider;
          const endPoint = slider.curve[slider.curve.length - 1];

          if (
            distSqr(objectI.x, objectI.y, endPoint.x, endPoint.y) <
            STACK_LENIENCE_SQR
          ) {
            const offset = objectI.stackCount - slider.stackCount + 1;
            for (let j = n + 1; j <= i; j++) {
              const objectJ = this.notes[j];
              if (
                distSqr(objectJ.x, objectJ.y, endPoint.x, endPoint.y) <
                STACK_LENIENCE_SQR
              ) {
                objectJ.stackCount -= offset;
              }
            }
          }
        }

        // Normal stacking
        if (
          distSqr(objectI.x, objectI.y, objectN.x, objectN.y) <
          STACK_LENIENCE_SQR
        ) {
          objectN.stackCount = objectI.stackCount + 1;
          objectI = objectN;
        }
      }
    }
  }

  async loadMusic() {
    if (this.audioFilename == null) console.error('Missing audio filename');

    // TODO: extract audio playback
    const res = await AudioLoader.load('beatmaps/' + this.audioFilename);
    this.music = res.data;
  }

  async load(skin: Skin) {
    // TODO: extract gameplay logic
    this.left = 0;
    this.right = 0;

    await this.parseHitObjects();
    this.calcStacking();
    await this.loadMusic();
    const stats = {
      ar: this.ar,
      cs: this.cs,
      od: this.od,
      sliderMultiplier: this.sliderMultiplier
    };
    this.notes.forEach(n => n.load(skin, stats));
  }

  play() {
    this.music.play();
  }

  // Returns index of earliest unfinished hit object
  getNextNote() {
    let index = this.left;
    while (index < this.right && this.notes[index].finished > 0) index++;
    return index;
  }

  isMissed(time: number, index: number) {
    const object = this.notes[index];
    switch (object.type) {
      case ObjectTypes.HIT_CIRCLE:
        if (time > object.t + this.hitWindows[HitResultType.HIT50]) {
          this.hitResult.addResult(
            HitResultType.MISS,
            object.x,
            object.y,
            time
          );
          return true;
        }
        break;
      case ObjectTypes.SLIDER:
        const slider = object as Slider;
        // Ignore active sliders
        // TODO: fix slider behaviour when missed slider head
        if (
          !slider.active &&
          time > slider.t + this.hitWindows[HitResultType.HIT50]
        ) {
          this.hitResult.addResult(
            HitResultType.MISS,
            slider.points[0].x,
            slider.points[0].y,
            time
          );
          return true;
        }
        break;
    }
    return false;
  }

  update(time: number) {
    // Check for new notes
    if (
      this.right < this.notes.length &&
      time > this.notes[this.right].t - this.fadeTime
    ) {
      this.notes[this.right].setVisible(true);
      this.right++;
    }

    // Check for missed notes
    let next = this.left;
    while (next < this.right) {
      if (this.notes[next].finished > 0) {
        // Ignore finished notes
        next++;
      } else if (this.isMissed(time, next)) {
        // Found missed note: flag as finished and check for other missed notes
        this.notes[next].finished = time;
        next++;
      } else {
        // Neither finished nor missed: can stop checking
        break;
      }
    }

    // Update notes (opacity, size, position, etc.)
    while (this.left < this.right && this.notes[this.left].update(time)) {
      // Don't have to update anymore
      this.notes[this.left].setVisible(false);
      this.left++;
    }
    for (let i = this.left + 1; i < this.right; i++) {
      this.notes[i].update(time);
    }
  }

  getHitResult(time: number, object: HitObject) {
    const dt = Math.abs(time - object.t);
    if (dt <= this.hitWindows[HitResultType.HIT300])
      return HitResultType.HIT300;
    if (dt <= this.hitWindows[HitResultType.HIT100])
      return HitResultType.HIT100;
    if (dt <= this.hitWindows[HitResultType.HIT50]) return HitResultType.HIT50;
    return HitResultType.MISS;
  }

  mousedown(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find next hit object to hit
    const index = this.getNextNote();
    if (index >= this.right) return;

    // Check for hit
    const object = this.notes[index];
    switch (object.type) {
      case ObjectTypes.HIT_CIRCLE:
        if (object.hit(position)) {
          object.finished = time;

          this.hitSound.playBaseSound(object.sampleSet, object.hitSound);

          const result = this.getHitResult(time, object);
          this.hitResult.addResult(result, object.x, object.y, time);
        }
        break;
      case ObjectTypes.SLIDER:
        const slider = object as Slider;
        if (!slider.active && slider.hit(position)) {
          slider.active = true;

          slider.playEdge(0);

          const result = this.getHitResult(time, object);
          this.hitResult.addResult(
            result,
            slider.points[0].x,
            slider.points[0].y,
            time
          );
        }
        break;
    }
  }

  mousemove(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find current hit object
    const index = this.getNextNote();
    if (index >= this.right) return;

    const object = this.notes[index];
    // TODO: handle spinners
    if (object.type != ObjectTypes.SLIDER) return;

    const slider = object as Slider;
    if (!slider.active || slider.hit(position)) return;

    // Slider break
    slider.active = false;
    slider.finished = time;
  }

  mouseup(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find current hit object
    const index = this.getNextNote();
    if (index >= this.right) return;

    const object = this.notes[index];
    // TODO: handle spinners
    if (object.type != ObjectTypes.SLIDER) return;

    const slider = object as Slider;
    if (!slider.active) return;

    // Active slider was let go
    slider.active = false;
    slider.finished = time;
  }
}
