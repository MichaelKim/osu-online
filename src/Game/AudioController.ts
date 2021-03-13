import PIXISound from 'pixi-sound';
// import { Loader } from 'pixi.js';
// import { loader } from './util';

export default class AudioController {
  // private loader: PIXI.Loader = new PIXI.Loader();
  private sounds: Record<string, PIXISound.Sound> = {};

  private elapsedTime = 0; // Offset due to resuming
  private resumeTime = 0; // When the audio was last resumed
  private current?: PIXISound.Sound;

  // async load(filename: string) {
  //   console.log('load', filename);
  //   if (!filename) {
  //     console.error('Missing audio filename');
  //     return;
  //   }

  //   const url = 'beatmaps/' + filename;

  //   // Cached
  //   if (this.sounds[url] != null) {
  //     this.current = this.sounds[url];
  //     return;
  //   }

  //   const res = await loader(this.loader.add(url, url));
  //   const data = res[url];
  //   if (data?.sound == null) {
  //     console.error('Error while loading audio:', url);
  //   } else {
  //     this.sounds[url] = data.sound;
  //   }
  // }

  async loadBlob(filename: string, audioFile: Blob) {
    console.log('load blob', filename);
    if (!filename) {
      console.error('Missing audio filename');
      return;
    }

    const buffer = await audioFile.arrayBuffer();
    this.sounds[filename] = PIXISound.add(filename, buffer);
  }

  async play(filename: string) {
    if (this.sounds[filename] == null) {
      console.log('No loaded audio');
      return;
    }
    this.current = this.sounds[filename];
    await this.current.play();
    this.resumeTime = this.getCurrentTime();
  }

  private getCurrentTime() {
    if (this.current == null) return 0;
    return this.current.context.audioContext.currentTime * 1000;
  }

  getTime() {
    if (this.current?.isPlaying) {
      return this.getCurrentTime() - this.resumeTime + this.elapsedTime;
    }

    return this.elapsedTime;
  }

  pause() {
    if (this.current?.isPlaying) {
      this.elapsedTime += this.getCurrentTime() - this.resumeTime;
      this.current.pause();
    }
  }

  resume() {
    this.resumeTime = this.getCurrentTime();
    this.current?.play({
      start: this.elapsedTime / 1000
    });
  }
}
