import * as PIXI from 'pixi.js';
import { IPointData } from '@pixi/math';

type ResizeCallback = (width: number, height: number) => void;

export default class Renderer {
  private renderer: PIXI.Renderer;

  // Bounds callbacks
  private resizeCallbacks = new Set<ResizeCallback>();

  // Stages
  private stage = new PIXI.Container(); // Base stage
  cursorStage = new PIXI.Container(); // Highest stage for cursor
  private gameStage = new PIXI.Container(); // Game field (osu!pixels with 4:3)

  // Substage
  notesStage = new PIXI.Container(); // Stage for hit objects
  hitResultStage = new PIXI.Container(); // Stage for hit results
  followStage = new PIXI.Container(); // Stage for follow points
  displayStage = new PIXI.Container(); // Stage for HUD elements
  bgStage = new PIXI.Container(); // Stage for background elements
  resumeStage = new PIXI.Container(); // Stage for display elements below the cursor

  constructor(view: HTMLCanvasElement) {
    this.renderer = new PIXI.Renderer({
      width: window.innerWidth,
      height: window.innerHeight,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      view
    });
    // Disable PIXI interaction (e.g. hit testing, input events)
    this.renderer.plugins.interaction.destroy();
    // Disable shared ticker
    PIXI.Ticker.shared.autoStart = false;
    PIXI.Ticker.shared.stop();

    this.stage.addChild(
      this.bgStage,
      this.gameStage,
      this.resumeStage,
      this.cursorStage,
      this.displayStage
    );

    this.gameStage.addChild(
      this.followStage,
      this.notesStage,
      this.hitResultStage
    );
  }

  async start() {
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  stop() {
    window.removeEventListener('resize', this.resize);
  }

  // Bound for addEventListener
  private resize = () => {
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

    this.resizeCallbacks.forEach(cb => cb(width, height));
  };

  render() {
    this.renderer.render(this.stage);
  }

  // Converts real pixels to osu!pixels
  toOsuPixels(point: IPointData) {
    return this.gameStage.toLocal(point, undefined, undefined, true);
  }

  // getBounds() {
  //   return [window.innerWidth, window.innerHeight];
  // }

  // Immediately calls callback on register
  onResize(callback: (width: number, height: number) => void) {
    callback(window.innerWidth, window.innerHeight);
    this.resizeCallbacks.add(callback);
    return () => this.resizeCallbacks.delete(callback);
  }
}
