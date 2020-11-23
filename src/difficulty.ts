import HitCircle, { Stats } from './hitcircle';
import { Skin } from './skin';
import { arToMS, odToMS } from './timing';

export default class BeatmapDifficulty {
  notes: HitCircle[];
  stats: Stats;

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

  constructor(notes: HitCircle[], stats: Stats) {
    this.notes = notes;
    this.stats = stats;

    [this.fadeTime, this.fullTime] = arToMS(this.stats.ar);
    this.hitWindows = odToMS(this.stats.od);
  }

  load(skin: Skin) {
    this.left = 0;
    this.right = 0;

    this.notes.forEach(n => n.load(skin, this.stats));
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
