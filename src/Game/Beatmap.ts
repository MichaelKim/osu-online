import * as PIXI from 'pixi.js';
import AudioController from './AudioController';
import GameState from './State/GameState';
import { HitObject, HitObjectTypes } from './HitObjects';
import { BeatmapData } from './Loader/BeatmapLoader';
import { loadHitObjects } from './Loader/HitObjectLoader';
import Skin from './Skin';

export default class Beatmap {
  notes: HitObject[] = [];

  // Gameplay
  left = 0;
  right = 0;

  constructor(
    readonly data: BeatmapData,
    private audio: AudioController,
    private gameState: GameState
  ) {}

  async load(stage: PIXI.Container, skin: Skin) {
    this.notes = loadHitObjects(this.data, skin, this.gameState);
    this.gameState.load(this);

    // stage.removeChildren();
    for (let i = this.notes.length - 1; i >= 0; i--) {
      this.notes[i].addToStage(stage);
    }

    await this.audio.load(this.data.audioFilename);
  }

  play() {
    this.audio.play();
  }

  // Returns index of earliest unfinished hit object
  getNextNote() {
    let index = this.left;
    while (index < this.right && this.notes[index].finished > 0) index++;
    return index;
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

  mousedown(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find next hit object to hit
    const index = this.getNextNote();
    if (index >= this.right) return;

    // Send hit to hit object
    this.notes[index].hit(time, position);
  }

  mousemove(time: number, position: PIXI.Point) {
    // Ignore if no notes are currently visible
    if (this.left >= this.right) return;

    // Find current hit object
    const index = this.getNextNote();
    if (index >= this.right) return;

    const object = this.notes[index];
    if (object.type === HitObjectTypes.HIT_CIRCLE) return;

    object.move(time, position);
  }

  mouseup(time: number, position: PIXI.Point) {
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
