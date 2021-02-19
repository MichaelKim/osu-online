import * as PIXI from 'pixi.js';
import { loader } from './util';

export default class AudioController {
  private loader: PIXI.Loader = new PIXI.Loader();
  private sounds: Record<string, PIXI.sound.Sound> = {};

  private elapsedTime = 0; // Offset due to resuming
  private resumeTime = 0; // When the audio was last resumed
  private pausedTime = Infinity; // When the audio was paused (Infinity if currently playing)
  private current?: PIXI.sound.Sound;

  async load(filename: string) {
    if (!filename) {
      console.error('Missing audio filename');
      return;
    }

    const url = 'beatmaps/' + filename;

    // Cached
    if (this.sounds[url] != null) {
      this.current = this.sounds[url];
      return;
    }

    const res = await loader(this.loader.add(url, url));
    const data = res[url];
    if (data?.sound == null || data?.error !== null) {
      console.error('Error while loading audio:', url);
      console.error(data?.error);
    } else {
      this.sounds[url] = data.sound;
      this.current = this.sounds[url];
    }
  }

  play() {
    if (this.current == null) {
      console.log('No loaded audio');
      return;
    }

    this.resumeTime = this.getCurrentTime();
    this.current.play();
  }

  private getCurrentTime() {
    if (this.current == null) return 0;
    return this.current.context.audioContext.currentTime * 1000;
  }

  getTime() {
    return (
      Math.min(this.getCurrentTime(), this.pausedTime) -
      this.resumeTime +
      this.elapsedTime
    );
  }

  pause() {
    this.current?.pause();
    if (this.pausedTime === Infinity) {
      this.pausedTime = this.getCurrentTime();
    }
  }

  resume() {
    this.current?.resume();
    if (this.pausedTime !== Infinity) {
      this.elapsedTime += this.pausedTime - this.resumeTime;
      this.resumeTime = this.getCurrentTime();
      this.pausedTime = Infinity;
    }
  }
}
