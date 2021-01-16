import * as PIXI from 'pixi.js';
import * as AudioLoader from './AudioLoader';
import { GameState } from './Game';
import { HitObject, HitObjectTypes } from './HitObjects';
import { BeatmapData, parseBeatmap } from './Loader/BeatmapLoader';
import { loadHitObjects } from './Loader/HitObjectLoader';
import { Skin } from './Skin';
import { readFile } from './util';

export default class Beatmap {
  data: BeatmapData;

  notes: HitObject[] = [];

  // Gameplay
  left: number = 0;
  right: number = 0;
  music: HTMLAudioElement;

  constructor(
    private filepath: string, // Path to .osu file
    private gameState: GameState
  ) {}

  async preload() {
    const file = await readFile(this.filepath);
    this.data = parseBeatmap(file);
  }

  async loadMusic() {
    if (!this.data.audioFilename) console.error('Missing audio filename');

    // TODO: extract audio playback
    const res = await AudioLoader.load('beatmaps/' + this.data.audioFilename);
    this.music = res.data;
  }

  async load(skin: Skin) {
    // TODO: extract gameplay logic
    this.left = 0;
    this.right = 0;

    this.notes = await loadHitObjects(
      this.filepath,
      this.data,
      skin,
      this.gameState
    );
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
