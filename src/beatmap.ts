import BeatmapDifficulty from './BeatmapDifficulty';
import HitCircle, { Stats } from './HitCircle';
import { Skin } from './Skin';

export default class Beatmap {
  difficulties: BeatmapDifficulty[];
  selectedDifficulty: number;

  skin: Skin;

  constructor(diffs: { notes: HitCircle[]; stats: Stats }[]) {
    this.difficulties = diffs.map(d => new BeatmapDifficulty(d.notes, d.stats));
    this.selectedDifficulty = 0;
  }

  load(skin: Skin, index: number) {
    // Load skin
    this.skin = skin;

    // Load difficulty
    this.selectedDifficulty = index;
    this.difficulties[this.selectedDifficulty].load(this.skin);
  }

  update(time: number) {
    this.difficulties[this.selectedDifficulty].update(time);
  }

  click(time: number, x: number, y: number) {
    this.difficulties[this.selectedDifficulty].click(time, x, y);
  }
}
