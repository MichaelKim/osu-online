import { Options } from '../UI/options';
import AudioController from './AudioController';
import BackgroundController from './BackgroundController';
import Beatmap from './Beatmap';
import Clock from './Clock';
import Cursor from './Cursor';
import FollowPointController from './FollowPointController';
import InputController, { InputType } from './InputController';
import IntroController, { INTRO_TIME, MIN_INTRO_SKIP } from './IntroController';
import { BeatmapData } from './Loader/BeatmapLoader';
import { lockPointer, unlockPointer } from './lock';
import OptionsController from './OptionsController';
import Renderer from './Renderer';
import ResumeController from './ResumeController';
import Skin from './Skin';
import GameState from './State/GameState';
import { GameResult } from './State/ScoreState';

export type BeatmapFile = {
  name: string;
  blob: Blob;
};

export type Stats = {
  gameResult: GameResult;
  beatmapData: BeatmapData;
};

export default class Game {
  private renderer: Renderer;
  private input: InputController;
  private skin: Skin;
  private clock: Clock;
  private audio: AudioController;
  private background: BackgroundController;
  private options: OptionsController;
  private intro: IntroController;

  private doneCallback?: (stats: Stats) => void;

  // Based on skin
  private cursor!: Cursor; // TODO: is there a better way than using !
  private beatmap!: Beatmap;
  private gameState!: GameState;
  private followPoint!: FollowPointController;
  private resumer!: ResumeController;

  // Gameplay state
  private _isPlaying = false;
  private isFinished = 0;

  constructor(private view: HTMLCanvasElement) {
    this.renderer = new Renderer(view);
    this.options = new OptionsController();
    // TODO: what about switching skins?
    this.skin = new Skin('assets/skin.ini');
    this.audio = new AudioController();
    this.clock = new Clock(this.audio, this.update);
    this.input = new InputController(this.clock, this.options);
    this.background = new BackgroundController(this.renderer);
    this.intro = new IntroController(this.renderer);
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

    this._isPlaying = true;

    this.view.style.display = 'block';
    await lockPointer(this.view, this.options.options.cursorType);
    this.cursor.hideCursor();

    await this.audio.play();
    this.clock.start();
    this.input.start();

    // In case the game paused while loading
    if (!this._isPlaying) {
      this.pause();
    }

    const startTime = this.beatmap.startTime();
    if (startTime > MIN_INTRO_SKIP) {
      this.intro.showIntro(startTime);
    }
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

    if (!this._isPlaying) {
      this.renderer.render();
      return;
    }

    // Check for input events since last frame
    for (const event of this.input.events) {
      switch (event.type) {
        case InputType.SPACE:
          if (this.intro.space(event.time)) {
            this.audio.seek(this.beatmap.startTime() - INTRO_TIME);
          }
          break;
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

    this.intro.update(time);
    this.beatmap.update(time);
    this.gameState.update(time);
    this.followPoint.update(time);
    this.renderer.render();

    if (this.isFinished === 0 && time >= this.beatmap.endTime()) {
      // Run once
      this.isFinished = time;
    } else if (this.isFinished > 0 && time > this.isFinished + 1000) {
      this.done();
    }
  };

  onDone(callback: (stats: Stats) => void) {
    this.doneCallback = callback;
  }

  async pause() {
    if (this.isFinished > 0) {
      await this.done();
      return;
    }

    this.audio.pause();
    this.cursor.showCursor();
    this.resumer.pause(this.cursor.getPosition());
    this.input.stop();
    this._isPlaying = false;
  }

  async resume() {
    this._isPlaying = true;
    await lockPointer(this.view, this.options.options.cursorType);
    this.cursor.hideCursor();
    this.input.start();

    if (this.beatmap.startTime() - this.clock.getTime() <= MIN_INTRO_SKIP) {
      this.resumer.startResume();
    } else {
      // Don't show resume if still skippable
      this.audio.resume();
    }
  }

  async retry() {
    this.audio.stop();
    this.input.stop();
    this.clock.stop();
    this.gameState.restart();
    this.followPoint.restart();
    this.beatmap.restart();

    await this.play();
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
    this._isPlaying = false;
  }

  async done() {
    const gameResult = this.gameState.getState();
    const beatmapData = this.beatmap.data;

    this.quit();
    await unlockPointer();
    this.doneCallback?.({
      beatmapData,
      gameResult
    });
  }

  isPlaying() {
    return this._isPlaying;
  }

  setOptions(o: Partial<Options>) {
    this.options.set(o);
  }
}
