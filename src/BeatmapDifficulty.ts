import HitCircle from './HitCircle';
import { Skin } from './Skin';
import { arToMS, odToMS } from './timing';

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

  async parseHitObjects() {
    const file = await this.readFile();
    let i = file.indexOf('[HitObjects]') + 1;

    while (i < file.length && file[i][0] !== '[') {
      const tokens = file[i].split(',');
      const x = parseInt(tokens[0]);
      const y = parseInt(tokens[1]);
      const time = parseInt(tokens[2]);

      this.notes.push(new HitCircle(x, y, time));

      i++;
    }
  }

  async load() {
    await this.parseFile();

    [this.fadeTime, this.fullTime] = arToMS(this.ar);
    this.hitWindows = odToMS(this.od);
  }

  async play(skin: Skin) {
    this.left = 0;
    this.right = 0;

    await this.parseHitObjects();
    this.notes.forEach(n =>
      n.load(skin, {
        ar: this.ar,
        cs: this.cs,
        od: this.od
      })
    );
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

  click(time: number, x: number, y: number) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return false;

    if (this.notes[this.left].click(x, y)) {
      const dt = Math.abs(time - this.notes[this.left].t);
      this.notes[this.left].setVisible(false);
      this.left++;

      if (dt <= this.hitWindows[300]) console.log('300');
      else if (dt <= this.hitWindows[100]) console.log('100');
      else console.log('50');
    }
  }
}
