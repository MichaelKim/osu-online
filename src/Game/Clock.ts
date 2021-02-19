import AudioController from './AudioController';

export default class Clock {
  private requestID = 0;

  constructor(
    private audio: AudioController,
    private callback: (time: number) => void
  ) {}

  start() {
    this.requestID = window.requestAnimationFrame(this.update);
  }

  private update = () => {
    this.callback(this.getTime());
    this.requestID = window.requestAnimationFrame(this.update);
  };

  getTime() {
    return this.audio.getTime();
  }

  stop() {
    window.cancelAnimationFrame(this.requestID);
    this.requestID = 0;
  }
}
