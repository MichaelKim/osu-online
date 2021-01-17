import * as PIXI from 'pixi.js';
import { initLock, lockPointer } from './lock';

export default class Renderer {
  renderer: PIXI.Renderer;

  // Stages
  stage: PIXI.Container; // Base stage
  cursorStage: PIXI.Container; // Highest stage for cursor
  gameStage: PIXI.Container; // Game field (osu!pixels with 4:3)

  // Substage
  notesStage: PIXI.Container; // Stage for hit objects
  hitResultStage: PIXI.Container; // Stage for hit results
  followStage: PIXI.Container; // Stage for follow points

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
    this.gameStage = new PIXI.Container();
    this.stage.addChild(this.gameStage, this.cursorStage);

    this.notesStage = new PIXI.Container();
    this.hitResultStage = new PIXI.Container();
    this.followStage = new PIXI.Container();
    this.gameStage.addChild(
      this.followStage,
      this.notesStage,
      this.hitResultStage
    );
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
    this.gameStage.position.set(xoffset, yoffset);
    this.gameStage.scale.set(scale);
  };

  render() {
    this.renderer.render(this.stage);
  }

  // Converts real pixels to osu!pixels
  toOsuPixels(point: PIXI.Point) {
    return this.gameStage.toLocal(point, undefined, undefined, true);
  }

  // getBounds() {
  //   return [window.innerWidth, window.innerHeight];
  // }
}
