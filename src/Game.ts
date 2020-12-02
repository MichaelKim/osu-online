import * as PIXI from 'pixi.js';
import { lockPointer } from './lock';
import BeatmapDifficulty from './BeatmapDifficulty';

export default class Game {
  renderer: PIXI.Renderer;
  stage: PIXI.Container; // Base stage
  cursorStage: PIXI.Container; // Highest stage for cursor
  notesStage: PIXI.Container; // Stage for hit objects

  ticker: PIXI.Ticker;
  time: number;

  constructor(view: HTMLCanvasElement) {
    this.renderer = new PIXI.Renderer({
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      view
    });

    this.stage = new PIXI.Container();
    this.stage.interactive = true;

    this.cursorStage = new PIXI.Container();
    this.notesStage = new PIXI.Container();
    this.stage.addChild(this.notesStage, this.cursorStage);

    this.ticker = new PIXI.Ticker();
    this.time = 0;
  }

  init() {
    this.renderer.view.style.display = 'block';
    window.addEventListener('resize', () => {
      this.renderer.resize(window.innerWidth, window.innerHeight);
    });
    lockPointer(this.renderer.view);
  }

  play(beatmap: BeatmapDifficulty) {
    this.time = 0;
    this.ticker.add(() => {
      this.time += this.ticker.deltaMS;
      beatmap.update(this.time);
      this.renderer.render(this.stage);
    }, PIXI.UPDATE_PRIORITY.LOW);
    this.ticker.start();
  }
}
