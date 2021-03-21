import { Container } from '@pixi/display';
import { IPointData } from '@pixi/math';
import { HitObject, HitObjectTypes } from './HitObjects';
import { BeatmapData } from './Loader/BeatmapLoader';
import { loadHitObjects } from './Loader/HitObjectLoader';
import Skin from './Skin';
import GameState from './State/GameState';

export default class Beatmap {
  notes: HitObject[] = [];

  // Gameplay
  left = 0;
  right = 0;

  constructor(
    readonly data: BeatmapData,
    gameState: GameState,
    private stage: Container,
    skin: Skin
  ) {
    this.notes = loadHitObjects(data, skin, gameState);
    gameState.load(this);

    for (let i = this.notes.length - 1; i >= 0; i--) {
      this.notes[i].addToStage(stage);
    }
  }

  // Returns index of earliest unfinished hit object
  private getNextNote() {
    let index = this.left;
    while (index < this.right && this.notes[index].finished > 0) index++;
    return index;
  }

  restart() {
    this.stage.removeChildren();
    for (let i = this.notes.length - 1; i >= 0; i--) {
      this.notes[i].init();
      this.notes[i].addToStage(this.stage);
    }
    this.left = 0;
    this.right = 0;
  }

  unload() {
    this.stage.removeChildren();
  }

  update(time: number) {
    // Check for new notes
    while (
      this.right < this.notes.length &&
      time > this.notes[this.right].enter
    ) {
      this.notes[this.right].setVisible(true);
      this.right++;
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

  startTime() {
    return this.notes[0].o.t;
  }

  endTime() {
    return this.notes[this.notes.length - 1].endTime;
  }

  mousedown(time: number, position: IPointData) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find next hit object to hit
    const index = this.getNextNote();
    if (index >= this.right) return;

    // Send hit to hit object
    this.notes[index].hit(time, position);
  }

  mousemove(time: number, position: IPointData) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find current hit object
    const index = this.getNextNote();
    if (index >= this.right) return;

    const object = this.notes[index];
    if (object.type === HitObjectTypes.HIT_CIRCLE) return;

    object.move(time, position);
  }

  mouseup(time: number, position: IPointData) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find current hit object
    const index = this.getNextNote();
    if (index >= this.right) return;

    const object = this.notes[index];
    if (object.type === HitObjectTypes.HIT_CIRCLE) return;

    object.up(time, position);
  }
}
