import PIXISound from 'pixi-sound';
// import { Loader } from 'pixi.js';
// import { loader } from './util';

export default class AudioController {
  // private loader: PIXI.Loader = new PIXI.Loader();
  private sounds: Record<string, PIXISound.Sound> = {};

  private elapsedTime = 0; // Offset due to resuming
  private resumeTime = 0; // When the audio was last resumed
  private current?: PIXISound.Sound;

  private complete = 0;

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

    if (this.sounds[filename] == null) {
      const buffer = await audioFile.arrayBuffer();
      this.sounds[filename] = PIXISound.add(filename, buffer);
    }

    this.current = this.sounds[filename];
  }

  async play() {
    if (this.current == null) {
      console.log('No loaded audio');
      return;
    }

    this.complete = 0;
    await this.current.play({
      complete: () => {
        console.log('audio done');
        this.complete =
          this.getCurrentTime() -
          this.resumeTime +
          this.elapsedTime -
          performance.now();
      }
    });
    this.resumeTime = this.getCurrentTime();
    this.elapsedTime = 0;
  }

  private getCurrentTime() {
    if (this.current == null) return 0;
    return this.current.context.audioContext.currentTime * 1000;
  }

  getTime() {
    if (this.complete > 0) {
      return this.complete + performance.now();
    }

    if (this.current?.isPlaying) {
      return this.getCurrentTime() - this.resumeTime + this.elapsedTime;
    }

    return this.elapsedTime;
  }

  isPlaying() {
    return this.current?.isPlaying;
  }

  pause() {
    if (this.current?.isPlaying) {
      this.elapsedTime += this.getCurrentTime() - this.resumeTime;
      this.current.pause();
    }
  }

  async resume() {
    await this.current?.play({
      start: this.elapsedTime / 1000
    });
    this.resumeTime = this.getCurrentTime();
  }

  stop() {
    this.current?.stop();
  }
}
