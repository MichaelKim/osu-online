import * as PIXI from 'pixi.js';
import BeatmapDifficulty from './BeatmapDifficulty';
import Renderer from './Renderer';
import InputController from './InputController';
import { Skin } from './Skin';

export default class Game {
  renderer: Renderer;
  input: InputController;
  skin: Skin;

  ticker: PIXI.Ticker;
  time: number;

  beatmap: BeatmapDifficulty;

  constructor(view: HTMLCanvasElement) {
    this.renderer = new Renderer(view);
    this.input = new InputController(this);
    this.skin = new Skin('assets/skin.ini');

    this.ticker = new PIXI.Ticker();
    this.time = 0;
  }

  async init() {
    await this.renderer.start();
    await this.skin.load(this.renderer.renderer);

    // Setup cursor
    this.input.loadTexture(this.skin);
    this.renderer.cursorStage.addChild(this.input.cursor);
    this.input.start();
  }

  loadTest() {
    const container = new PIXI.Container();

    this.renderer.stage.addChildAt(container, 0);

    // Create a 5x5 grid of bunnies
    for (let i = 0; i < 25; i++) {
      const bunny = new PIXI.Sprite(this.skin.cursor);
      bunny.anchor.set(0);
      bunny.x = (i % 5) * 40;
      bunny.y = Math.floor(i / 5) * 40;
      container.addChild(bunny);
    }

    // Move container to the center
    container.x = this.renderer.renderer.screen.width / 2;
    container.y = this.renderer.renderer.screen.height / 2;

    // Center bunny sprite in local container coordinates
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;

    // Listen for animate update
    const ticker = new PIXI.Ticker();
    ticker.add(delta => {
      // rotate the container!
      // use delta to create frame-independent transform
      container.rotation -= 0.01 * delta;
    }, PIXI.UPDATE_PRIORITY.LOW);
    ticker.start();

    window.addEventListener('resize', () => {
      container.x = window.innerWidth / 2;
      container.y = window.innerHeight / 2;
    });
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
    // TODO
    this.beatmap?.mousemove(this.time, position);
  }

  onUp(position: PIXI.Point) {
    this.beatmap.mouseup(this.time, position);
  }
}
