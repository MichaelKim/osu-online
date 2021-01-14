import * as PIXI from 'pixi.js';
import * as AudioLoader from './AudioLoader';
import FollowPointController from './FollowPointController';
import { HitObject, HitObjectTypes } from './HitObjects';
import HitResultController, { HitResultType } from './HitResultController';
import HitSoundController from './HitSoundController';
import {
  BeatmapData,
  parseBeatmap,
  parseHitObjects
} from './Loader/BeatmapLoader';
import { Skin } from './Skin';
import { arToMS, odToMS } from './timing';
import { readFile, within } from './util';

const STACK_LENIENCE = 3;

export default class Beatmap {
  filepath: string; // Path to .osu file

  data: BeatmapData;

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
  followPoints: FollowPointController;
  left: number = 0;
  right: number = 0;
  music: HTMLAudioElement;

  constructor(
    filepath: string,
    hitResult: HitResultController,
    hitSound: HitSoundController,
    followPoints: FollowPointController
  ) {
    this.filepath = filepath;
    this.hitResult = hitResult;
    this.hitSound = hitSound;
    this.followPoints = followPoints;
  }

  async preload() {
    const file = await readFile(this.filepath);
    this.data = parseBeatmap(file);
  }

  // Taken from https://gist.github.com/peppy/1167470
  calcStacking() {
    const [fadeTime] = arToMS(this.data.ar);
    // Reverse pass
    for (let i = this.notes.length - 1; i > 0; i--) {
      let objectI = this.notes[i];

      // Already done
      if (objectI.type === HitObjectTypes.SPINNER || objectI.stackCount !== 0) {
        continue;
      }

      // Search for any stacking
      for (let n = i - 1; n >= 0; n--) {
        const objectN = this.notes[n];
        if (objectN.type === HitObjectTypes.SPINNER) {
          continue;
        }

        if (
          objectI.o.t - fadeTime * this.data.stackLeniency >
          objectN.endTime
        ) {
          break;
        }

        // Reverse stacking
        if (objectN.type === HitObjectTypes.SLIDER) {
          if (within(objectN.end, objectI.start, STACK_LENIENCE)) {
            const offset = objectI.stackCount - objectN.stackCount + 1;
            for (let j = n + 1; j <= i; j++) {
              const objectJ = this.notes[j];
              if (
                objectJ.type !== HitObjectTypes.SPINNER &&
                within(objectN.end, objectJ.start, STACK_LENIENCE)
              ) {
                objectJ.stackCount -= offset;
              }
            }
          }
        }

        // Normal stacking
        if (within(objectI.start, objectN.start, STACK_LENIENCE)) {
          objectN.stackCount = objectI.stackCount + 1;
          objectI = objectN;
        }
      }
    }
  }

  async loadMusic() {
    if (!this.data.audioFilename) console.error('Missing audio filename');

    // TODO: extract audio playback
    const res = await AudioLoader.load('beatmaps/' + this.data.audioFilename);
    this.music = res.data;
  }

  async load(skin: Skin) {
    [this.fadeTime, this.fullTime] = arToMS(this.data.ar);
    this.hitWindows = odToMS(this.data.od);

    // TODO: extract gameplay logic
    this.left = 0;
    this.right = 0;

    const file = await readFile(this.filepath);
    this.notes = parseHitObjects(file, this.data, skin, this.hitSound);
    this.calcStacking();
    await this.loadMusic();
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
      case HitObjectTypes.HIT_CIRCLE:
        if (time > object.o.t + this.hitWindows[HitResultType.HIT50]) {
          this.hitResult.addResult(
            HitResultType.MISS,
            object.o.x,
            object.o.y,
            time
          );
          return true;
        }
        break;
      case HitObjectTypes.SLIDER:
        // Ignore active sliders
        // TODO: fix slider behaviour when missed slider head
        if (
          !object.active &&
          time > object.o.t + this.hitWindows[HitResultType.HIT50]
        ) {
          this.hitResult.addResult(
            HitResultType.MISS,
            object.start.x,
            object.start.y,
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
      time > this.notes[this.right].o.t - this.fadeTime
    ) {
      this.notes[this.right].setVisible(true);

      // Follow point trails
      // TODO: this timing isn't correct
      // Follow trail should appear for ~1s, fully fading around ~0.5s after the previous hit object ends
      // This means the trail can appear before the next object begins to fade in
      const nextObject = this.notes[this.right];

      if (
        nextObject.type !== HitObjectTypes.SPINNER &&
        nextObject.o.comboNumber !== 1
      ) {
        const prevObject = this.notes[this.right - 1];

        if (prevObject.type === HitObjectTypes.SLIDER) {
          const prev =
            prevObject.o.slides % 2 === 0 ? prevObject.start : prevObject.end;
          this.followPoints.addTrail(
            prev,
            nextObject.start,
            prevObject.endTime,
            nextObject.o.t
          );
        } else if (prevObject.type === HitObjectTypes.HIT_CIRCLE) {
          this.followPoints.addTrail(
            prevObject.start,
            nextObject.start,
            prevObject.o.t,
            nextObject.o.t
          );
        }
      }
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
    const dt = Math.abs(time - object.o.t);
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
      case HitObjectTypes.HIT_CIRCLE:
        if (object.hit(position)) {
          object.finished = time;

          this.hitSound.playBaseSound(object.o.sampleSet, object.o.hitSound);

          const result = this.getHitResult(time, object);
          this.hitResult.addResult(result, object.o.x, object.o.y, time);
        }
        break;
      case HitObjectTypes.SLIDER:
        if (!object.active && object.hit(position)) {
          object.active = true;

          object.playEdge(0);

          const result = this.getHitResult(time, object);
          this.hitResult.addResult(
            result,
            object.start.x,
            object.start.y,
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
    if (object.type != HitObjectTypes.SLIDER) return;

    if (!object.active || object.hit(position)) return;

    // Slider break
    object.active = false;
    object.finished = time;
  }

  mouseup(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find current hit object
    const index = this.getNextNote();
    if (index >= this.right) return;

    const object = this.notes[index];
    // TODO: handle spinners
    if (object.type != HitObjectTypes.SLIDER) return;

    if (!object.active) return;

    // Active slider was let go
    object.active = false;
    object.finished = time;
  }
}
