export default class Clock {
  private startTime: number = 0;
  private requestID: number = 0;

  constructor(private callback: (time: number) => void) {}

  start() {
    this.startTime = performance.now();
    this.requestID = window.requestAnimationFrame(this.update);
  }

  // TODO: sync with audio
  private update = (time: number) => {
    this.callback(time - this.startTime);
    this.requestID = window.requestAnimationFrame(this.update);
  };

  getTime() {
    return performance.now() - this.startTime;
  }

  stop() {
    window.cancelAnimationFrame(this.requestID);
    this.requestID = 0;
  }
}
