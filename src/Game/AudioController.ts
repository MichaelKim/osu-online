import PIXISound from 'pixi-sound';
import { INTRO_TIME } from './IntroController';

export default class AudioController {
  private sounds: Record<string, AudioBuffer> = {};

  private elapsedTime = 0; // Offset due to resuming
  private resumeTime = 0; // When the audio was last resumed
  private current?: AudioBufferSourceNode;

  private isPlaying = false;
  private complete = 0;

  async loadBlob(filename: string, audioFile: Blob) {
    console.log('load blob', filename);
    if (!filename) {
      console.error('Missing audio filename');
      return;
    }

    if (this.sounds[filename] == null) {
      const context = AudioController.getContext();
      const buffer = await audioFile.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(buffer);

      this.sounds[filename] = audioBuffer;
    }

    this.current = this.cloneSource(this.sounds[filename]);
  }

  private static getContext() {
    return PIXISound.context.audioContext;
  }

  private cloneSource(buffer: AudioBuffer | null) {
    const context = AudioController.getContext();
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    source.onended = () => {
      this.complete =
        this.getCurrentTime() -
        this.resumeTime +
        this.elapsedTime -
        performance.now();
    };

    return source;
  }

  async play() {
    if (this.current == null) {
      console.log('No loaded audio');
      return;
    }

    this.complete = 0;
    this.isPlaying = true;

    this.resumeTime = this.getCurrentTime();
    this.elapsedTime = -INTRO_TIME;
    this.current.start((this.resumeTime - this.elapsedTime) / 1000);
  }

  seek(time: number) {
    if (this.current == null || !this.isPlaying) return;

    this.stop();

    this.complete = 0;
    this.isPlaying = true;

    this.resumeTime = this.getCurrentTime();
    this.elapsedTime = time;
    if (time < 0) {
      this.current.start((this.resumeTime - this.elapsedTime) / 1000);
    } else {
      this.current.start(0, this.elapsedTime / 1000);
    }
  }

  private getCurrentTime() {
    if (this.current == null) return 0;
    return this.current.context.currentTime * 1000;
  }

  getTime() {
    if (this.complete > 0) {
      return this.complete + performance.now();
    }

    if (this.isPlaying) {
      return this.getCurrentTime() - this.resumeTime + this.elapsedTime;
    }

    return this.elapsedTime;
  }

  pause() {
    if (this.current == null) return;

    if (this.isPlaying) {
      this.elapsedTime += this.getCurrentTime() - this.resumeTime;
    }

    this.stop();
  }

  async resume() {
    if (this.current == null) return;

    this.isPlaying = true;
    this.resumeTime = this.getCurrentTime();
    if (this.elapsedTime < 0) {
      this.current.start((this.resumeTime - this.elapsedTime) / 1000);
    } else {
      this.current.start(0, this.elapsedTime / 1000);
    }
  }

  stop() {
    if (this.current == null) return;

    if (this.isPlaying) {
      this.isPlaying = false;
      this.current.onended = null;
      this.current.stop();
    }

    const source = this.cloneSource(this.current.buffer);
    this.current.disconnect();
    this.current = source;
  }
}
