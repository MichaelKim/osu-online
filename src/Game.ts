import * as PIXI from 'pixi.js';
import BeatmapDifficulty from './BeatmapDifficulty';
import Renderer from './Renderer';
import InputController from './InputController';

export default class Game {
  renderer: Renderer;
  input: InputController;
  ticker: PIXI.Ticker;
  time: number;

  beatmap: BeatmapDifficulty;

  constructor(view: HTMLCanvasElement) {
    this.renderer = new Renderer(view);
    this.input = new InputController(this);
    this.ticker = new PIXI.Ticker();
    this.time = 0;
  }

  init() {
    this.renderer.start();
    this.input.start();
  }

  play(beatmap: BeatmapDifficulty) {
    this.time = 0;
    this.beatmap = beatmap;
    beatmap.play();
    this.ticker.add(() => {
      this.time += this.ticker.deltaMS;
      beatmap.update(this.time);
      this.renderer.render();
    }, PIXI.UPDATE_PRIORITY.LOW);
    this.ticker.start();
  }

  onDown(position: PIXI.Point) {
    this.beatmap.mousedown(this.time, position);
  }

  onMove(position: PIXI.Point) {
    this.beatmap?.mousemove(this.time, position);
  }

  onUp(position: PIXI.Point) {
    this.beatmap.mouseup(this.time, position);
  }
}
