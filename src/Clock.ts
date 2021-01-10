export default class Clock {
  startTime: number = 0;
  time: number = 0;

  constructor() {}

  start() {
    this.startTime = performance.now();
    this.time = 0;
  }

  // TODO: sync with audio
  update() {
    const now = performance.now();
    this.time = now - this.startTime;
  }
}
