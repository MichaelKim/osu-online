import * as AudioLoader from './AudioLoader';

export default class AudioController {
  current?: HTMLAudioElement;

  async load(filename: string) {
    if (!filename) {
      console.error('Missing audio filename');
      return;
    }

    const res = await AudioLoader.load('beatmaps/' + filename);
    this.current = res.data;
  }

  play() {
    if (this.current == null) {
      console.log('No loaded audio');
      return;
    }

    this.current.play();
  }

  getTime() {
    return this.current?.currentTime || 0;
  }
}
