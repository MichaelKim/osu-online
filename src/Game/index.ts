import { Options } from '../UI/options';
import AudioController from './AudioController';
import BackgroundController from './BackgroundController';
import Beatmap from './Beatmap';
import Clock from './Clock';
import Cursor from './Cursor';
import FollowPointController from './FollowPointController';
import InputController, { InputType } from './InputController';
import { BeatmapData } from './Loader/BeatmapLoader';
import { lockPointer } from './lock';
import OptionsController from './OptionsController';
import Renderer from './Renderer';
import ResumeController from './ResumeController';
import Skin from './Skin';
import GameState from './State/GameState';

export type BeatmapFile = {
  name: string;
  blob: Blob;
};

export default class Game {
  private renderer: Renderer;
  private input: InputController;
  private skin: Skin;
  private clock: Clock;
  private audio: AudioController;
  private background: BackgroundController;
  private options: OptionsController;

  // Based on skin
  private cursor!: Cursor; // TODO: is there a better way than using !
  private beatmap!: Beatmap;
  private gameState!: GameState;
  private followPoint!: FollowPointController;
  private resumer!: ResumeController;

  constructor(private view: HTMLCanvasElement) {
    this.renderer = new Renderer(view);
    this.options = new OptionsController();
    // TODO: what about switching skins?
    this.skin = new Skin('assets/skin.ini');
    this.audio = new AudioController();
    this.clock = new Clock(this.audio, this.update);
    this.input = new InputController(this.clock, this.options);
    this.background = new BackgroundController(this.renderer);
  }

  async init() {
    await this.renderer.start();
    await this.skin.load();

    this.cursor = new Cursor(this.renderer.cursorStage, this.skin);
    this.gameState = new GameState(this.renderer, this.skin);
    this.resumer = new ResumeController(this.renderer, this.skin);
    this.followPoint = new FollowPointController(
      this.renderer.followStage,
      this.skin
    );
  }

  async loadBeatmap(
    data: BeatmapData,
    bgFile: BeatmapFile | undefined,
    audioFile: BeatmapFile
  ) {
    // Load background image
    bgFile && (await this.background.loadBeatmap(bgFile.blob));

    // Load audio
    await this.audio.loadBlob(
      data.beatmapSetID + '-' + data.version,
      audioFile.blob
    );

    // Load beatmap
    this.beatmap = new Beatmap(
      data,
      this.gameState,
      this.renderer.notesStage,
      this.skin
    );

    this.followPoint.loadBeatmap(this.beatmap.notes);

    return true;
  }

  async play() {
    if (this.beatmap == null) {
      console.error('no beatmap loaded');
      return;
    }

    this.view.style.display = 'block';
    await lockPointer(this.view, this.options.options.cursorType);
    this.cursor.hideCursor();

    await this.audio.play();
    this.clock.start();
    this.input.start();
  }

  update = (time: number) => {
    if (this.resumer.isResuming()) {
      for (const event of this.input.events) {
        switch (event.type) {
          case InputType.DOWN:
            {
              if (this.resumer.within(event.position)) {
                this.resumer.endResume();
                this.audio.resume();
                this.beatmap.mousedown(
                  event.time,
                  this.renderer.toOsuPixels(event.position)
                );
              }
            }
            break;
          case InputType.MOVE:
            this.cursor.move(event.position);
            break;
        }
      }
      this.input.events = [];
      this.renderer.render();
      return;
    }

    if (!this.isPlaying()) {
      this.renderer.render();
      return;
    }

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

  async pause() {
    this.audio.pause();
    this.cursor.showCursor();
    this.resumer.pause(this.cursor.getPosition());
    this.input.stop();
  }

  async resume() {
    await lockPointer(this.view, this.options.options.cursorType);
    this.cursor.hideCursor();
    this.input.start();
    this.resumer.startResume();
  }

  async retry() {
    this.cursor.hideCursor();
    this.audio.stop();
    this.gameState.restart();
    this.followPoint.restart();
    this.beatmap.restart();

    await lockPointer(this.view, this.options.options.cursorType);
    this.cursor.hideCursor();
    await this.audio.play();
    this.input.start();
  }

  quit() {
    this.view.style.display = 'none';

    this.audio.stop();
    this.cursor.showCursor();
    this.input.stop();
    this.clock.stop();
    this.beatmap.unload();
    this.followPoint.reset();
    this.gameState.reset();

    // @ts-expect-error: delete
    this.beatmap = null;
  }

  isPlaying() {
    return this.audio.isPlaying();
  }

  setOptions(o: Partial<Options>) {
    this.options.set(o);
  }
}
