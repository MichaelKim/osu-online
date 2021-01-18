import * as PIXI from 'pixi.js';
import { loader } from './util';

export default class AudioController {
  private loader: PIXI.Loader = new PIXI.Loader();
  private sounds: Record<string, PIXI.sound.Sound> = {};

  private startTime: number = 0;
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

    this.startTime = this.current.context.audioContext.currentTime * 1000;
    this.current.play();
  }

  getTime() {
    if (this.current == null) return 0;
    return (
      this.current.context.audioContext.currentTime * 1000 - this.startTime
    );
  }

  pause() {
    this.current?.pause();
  }

  resume() {
    this.current?.play();
  }
}
