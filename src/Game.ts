import * as PIXI from 'pixi.js';
import { lockPointer } from './lock';
import BeatmapDifficulty from './BeatmapDifficulty';

// TODO: rename to application
// extract gameplay from pixi-related logic
export default class Game {
  renderer: PIXI.Renderer;
  stage: PIXI.Container; // Base stage
  cursorStage: PIXI.Container; // Highest stage for cursor

  // Stage for hit objects
  // Note position is in osu!pixels
  // Scaled to fit in window with 4:3 aspect ratio
  notesStage: PIXI.Container;

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

    this.cursorStage = new PIXI.Container();
    this.notesStage = new PIXI.Container();
    this.stage.addChild(this.notesStage, this.cursorStage);

    this.ticker = new PIXI.Ticker();
    this.time = 0;
  }

  resize() {
    // The playfield is a 512x384 box inside a 640x480 virtual screen,
    // scaled up to fit the actual screen
    const { width, height } = this.renderer.screen;
    const scale = width * 3 > height * 4 ? height / 480 : width / 640;
    const xoffset = (width - 512 * scale) / 2;
    const yoffset = (height - 384 * scale) / 2;
    this.notesStage.position.set(xoffset, yoffset);
    this.notesStage.scale.set(scale);
  }

  init() {
    this.renderer.view.style.display = 'block';
    window.addEventListener('resize', () => {
      this.renderer.resize(window.innerWidth, window.innerHeight);
      this.resize();
    });
    lockPointer(this.renderer.view);
    this.resize();
  }

  play(beatmap: BeatmapDifficulty) {
    this.time = 0;
    beatmap.play();
    this.ticker.add(() => {
      this.time += this.ticker.deltaMS;
      beatmap.update(this.time);
      this.renderer.render(this.stage);
    }, PIXI.UPDATE_PRIORITY.LOW);
    this.ticker.start();
  }
}
