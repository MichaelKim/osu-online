import * as PIXI from 'pixi.js';
import Beatmap from './Beatmap';
import Clock from './Clock';
import FollowPointController from './FollowPointController';
import HitCircle from './HitObjects/HitCircle';
import Slider from './HitObjects/Slider';
import HitResultController, { HitResultType } from './HitResultController';
import HitSoundController, {
  BaseHitSound,
  SliderHitSound
} from './HitSoundController';
import InputController, { InputType } from './InputController';
import Renderer from './Renderer';
import { Skin } from './Skin';
import { csToSize } from './timing';

export class GameState {
  score: number = 0;
  hitResult: HitResultController;
  hitSound: HitSoundController;

  constructor(renderer: Renderer, skin: Skin) {
    this.hitResult = new HitResultController(renderer.hitResultStage, skin);
    this.hitSound = new HitSoundController(skin);
  }

  load(beatmap: Beatmap) {
    this.hitResult.loadDiameter(csToSize(beatmap.data.cs));
  }

  addResult(type: HitResultType, object: HitCircle | Slider, time: number) {
    if (type !== HitResultType.MISS) {
      this.hitSound.playBaseSound(object.o.sampleSet, object.o.hitSound);
    }
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderHead(type: HitResultType, object: Slider, time: number) {
    if (type !== HitResultType.MISS) {
      this.addSliderEdge(object, time, 0);
    }
    this.hitResult.addResult(type, object.start, time);
  }

  addSliderTick(object: Slider, time: number) {
    this.hitSound.playSound(object.o.sampleSet, SliderHitSound.SLIDER_TICK);
  }

  addSliderEdge(object: Slider, time: number, index: number) {
    const hitSound = object.o.edgeSounds[index] || object.o.hitSound;
    // [normal, addition]
    const setIndex = hitSound === BaseHitSound.NORMAL ? 0 : 1;
    const sampleSet =
      object.o.edgeSets[index]?.[setIndex] || object.o.sampleSet;
    this.hitSound.playBaseSound(sampleSet, hitSound);
  }

  update(time: number) {
    this.hitResult.update(time);
  }
}

export default class Game {
  renderer: Renderer;
  input: InputController;
  skin: Skin;
  beatmap: Beatmap;
  clock: Clock;

  // Based on skin
  gameState: GameState;
  followPoint: FollowPointController;

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

  async loadBeatmap(filepath: string) {
    this.gameState = new GameState(this.renderer, this.skin);
    this.beatmap = new Beatmap(filepath, this.gameState);

    await this.beatmap.preload();
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
