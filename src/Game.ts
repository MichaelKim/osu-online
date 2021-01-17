import * as PIXI from 'pixi.js';
import Beatmap from './Beatmap';
import Clock from './Clock';
import Cursor from './Cursor';
import FollowPointController from './FollowPointController';
import GameState from './GameState';
import InputController, { InputType } from './InputController';
import { BeatmapData } from './Loader/BeatmapLoader';
import Renderer from './Renderer';
import { Skin } from './Skin';

export default class Game {
  renderer: Renderer;
  input: InputController;
  skin: Skin;
  clock: Clock;

  // Based on skin
  cursor!: Cursor;
  beatmap!: Beatmap;
  gameState!: GameState;
  followPoint!: FollowPointController;

  constructor(view: HTMLCanvasElement) {
    this.renderer = new Renderer(view);
    // TODO: what about switching skins?
    this.skin = new Skin('assets/skin.ini');
    this.clock = new Clock(this.update);
    this.input = new InputController(this.clock);
  }

  async init() {
    await this.renderer.start();
    await this.skin.load(this.renderer.renderer);

    this.cursor = new Cursor(this.renderer.cursorStage, this.skin);
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

  async loadBeatmap(data: BeatmapData) {
    this.gameState = new GameState(this.renderer, this.skin);
    this.beatmap = new Beatmap(data, this.gameState);

    this.gameState.load(this.beatmap);
    await this.beatmap.load(this.skin);

    // this.renderer.notesStage.removeChildren();
    for (let i = this.beatmap.notes.length - 1; i >= 0; i--) {
      this.beatmap.notes[i].addToStage(this.renderer.notesStage);
    }

    this.followPoint = new FollowPointController(
      this.renderer.followStage,
      this.beatmap.notes,
      this.skin
    );
  }

  play() {
    if (this.beatmap == null) {
      console.error('no beatmap loaded');
      return;
    }

    this.beatmap.play();
    this.clock.start();
  }

  update = (time: number) => {
    // Check for input events since last frame
    for (const event of this.input.events) {
      switch (event.type) {
        case InputType.DOWN:
          this.beatmap.mousedown(
            event.time,
            this.renderer.toOsuPixels(event.position)
          );
          break;
        case InputType.UP:
          this.beatmap.mouseup(
            event.time,
            this.renderer.toOsuPixels(event.position)
          );
          break;
        case InputType.MOVE:
          this.cursor.move(event.position);
          this.beatmap.mousemove(
            time,
            this.renderer.toOsuPixels(event.position)
          );
          break;
      }
    }
    this.input.events = [];

    this.beatmap.update(time);
    this.gameState.update(time);
    this.followPoint.update(time);
    this.renderer.render();
  };
}
