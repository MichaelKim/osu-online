import * as PIXI from 'pixi.js';
import { initLock, lockPointer } from './lock';

export default class Renderer {
  renderer: PIXI.Renderer;

  // Stages
  stage: PIXI.Container; // Base stage
  cursorStage: PIXI.Container; // Highest stage for cursor
  notesStage: PIXI.Container; // Stage for hit objects (osu!pixels with 4:3)

  constructor(view: HTMLCanvasElement) {
    this.renderer = new PIXI.Renderer({
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      view
    });
    // Optimization
    this.renderer.plugins.interaction.destroy();

    this.stage = new PIXI.Container();
    this.cursorStage = new PIXI.Container();
    this.notesStage = new PIXI.Container();
    this.stage.addChild(this.notesStage, this.cursorStage);
  }

  async start() {
    this.renderer.view.style.display = 'block';
    window.addEventListener('resize', this.resize);
    initLock(this.renderer.view);
    await lockPointer(this.renderer.view);
    this.resize();
  }

  stop() {
    window.removeEventListener('resize', this.resize);
  }

  // Bound for addEventListener
  resize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.resize(width, height);

    // The playfield is a 512x384 box inside a 640x480 virtual screen,
    // scaled up to fit the actual screen with a 4:3 aspect ratio
    const scale = width * 3 > height * 4 ? height / 480 : width / 640;
    const xoffset = (width - 512 * scale) / 2;
    const yoffset = (height - 384 * scale) / 2;
    this.notesStage.position.set(xoffset, yoffset);
    this.notesStage.scale.set(scale);
  };

  render() {
    this.renderer.render(this.stage);
  }

  // Converts real pixels to osu!pixels
  toOsuPixels(point: PIXI.Point) {
    return this.notesStage.toLocal(point, null, null, true);
  }

  // getBounds() {
  //   return [window.innerWidth, window.innerHeight];
  // }
}
