import * as PIXI from 'pixi.js';
import HitCircle from './HitCircle';
import { Skin } from './Skin';
import { arToMS, odToMS } from './timing';
import * as AudioLoader from './AudioLoader';

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

  notes: HitCircle[] = [];

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
                this.cs = parseInt(value);
                break;
              case 'OverallDifficulty':
                this.od = parseInt(value);
                break;
              case 'ApproachRate':
                this.ar = parseInt(value);
                break;
            }
          }
          break;
        case '[HitObjects]':
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
      if (type & (1 << 2)) {
        // New combo
        comboNumber = 1;

        const skip = ((type & (1 << 4)) | (1 << 5) | (1 << 6)) >> 4;
        comboIndex += skip;
      } else {
        comboNumber++;
      }
      this.notes.push(new HitCircle(tokens, comboNumber, comboIndex));

      i++;
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
    this.notes.forEach(n =>
      n.load(skin, {
        ar: this.ar,
        cs: this.cs,
        od: this.od
      })
    );
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
    if (
      this.left < this.right &&
      time > this.notes[this.left].t + this.hitWindows[50]
    ) {
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
