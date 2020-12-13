import * as PIXI from 'pixi.js';
import HitCircle from './HitCircle';
import { Skin } from './Skin';
import { arToMS, odToMS } from './timing';
import * as AudioLoader from './AudioLoader';
import { Slider } from './Slider';
import TimingPoint from './TimingPoint';

type HitObjects = HitCircle | Slider;

enum ObjectTypes {
  HIT_CIRCLE = 1 << 0,
  SLIDER = 1 << 1,
  NEW_COMBO = 1 << 2,
  SPINNER = 1 << 3,
  COMBO_SKIP = (1 << 4) | (1 << 5) | (1 << 6)
}

export default class BeatmapDifficulty {
  filepath: string; // Path to .osu file

  // general
  version: number = 14;
  audioFilename: string;
  audioLeadIn: number = 0;

  // difficulty
  cs: number;
  od: number;
  ar: number;
  sliderMultiplier: number;

  timingPoints: TimingPoint[] = [];
  notes: HitObjects[] = [];

  // Computed
  fadeTime: number; // Starts to fade in
  fullTime: number; // Fully opaque
  hitWindows: {
    300: number;
    100: number;
    50: number;
  };

  left: number;
  right: number;
  music: HTMLAudioElement;

  constructor(filepath: string) {
    this.filepath = filepath;
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
          while (i < file.length && file[i][0] !== '[') {
            const [key, value] = readKeyValue();
            switch (key) {
              case 'AudioFilename':
                this.audioFilename = value;
                break;
              case 'AudioLeadIn':
                this.audioLeadIn = parseInt(value);
                break;
            }
          }
          break;
        case '[Difficulty]':
          while (i < file.length && file[i][0] !== '[') {
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
            }
          }
          break;
        case '[TimingPoints]':
          while (i < file.length && file[i][0] !== '[') {
            const tokens = file[i++].split(',');
            this.timingPoints.push(new TimingPoint(tokens));
          }
          break;
        case '[HitObjects]':
          // Parse hit objects later
          while (i < file.length && file[i][0] !== '[') {
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
    let comboNumber = 1;
    let comboIndex = 0;

    let timingIndex = 1;
    let baseBeatLength = 1,
      beatLength = 1;
    if (this.timingPoints[0].inherited) {
      beatLength = baseBeatLength * this.timingPoints[0].mult;
    } else {
      baseBeatLength = beatLength = this.timingPoints[0].beatLength;
    }

    const file = await this.readFile();

    for (
      let i = file.indexOf('[HitObjects]') + 1;
      i < file.length && file[i][0] !== '[';
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

      if (type & ObjectTypes.HIT_CIRCLE) {
        this.notes.push(new HitCircle(tokens, comboNumber, comboIndex));
      } else if (type & ObjectTypes.SLIDER) {
        const slider = new Slider(tokens, comboNumber, comboIndex);

        // Calculate beat length
        while (
          timingIndex < this.timingPoints.length &&
          this.timingPoints[timingIndex].time < slider.t
        ) {
          timingIndex++;
        }
        if (this.timingPoints[timingIndex].inherited) {
          beatLength = baseBeatLength * this.timingPoints[timingIndex].mult;
        } else {
          baseBeatLength = beatLength = this.timingPoints[timingIndex]
            .beatLength;
        }

        slider.sliderTime =
          (beatLength * (slider.length / this.sliderMultiplier)) / 100;

        this.notes.push(slider);
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
    if (this.left < this.right && time > this.notes[this.left].t + 1000) {
      this.notes[this.left].setVisible(false);
      this.left++;
      console.log('miss');
    }

    // Update opacity of fading notes
    for (let i = this.left; i < this.right; i++) {
      this.notes[i].update(time);
    }
  }

  click(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return false;

    if (this.notes[this.left].click(position)) {
      const dt = Math.abs(time - this.notes[this.left].t);
      this.notes[this.left].setVisible(false);
      this.left++;

      if (dt <= this.hitWindows[300]) console.log('300');
      else if (dt <= this.hitWindows[100]) console.log('100');
      else console.log('50');
    }
  }
}
