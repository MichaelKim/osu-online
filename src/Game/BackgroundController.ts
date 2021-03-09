import * as PIXI from 'pixi.js';
import Renderer from './Renderer';

export default class BackgroundController {
  private container = new PIXI.Container();
  private background?: PIXI.Sprite;

  constructor(renderer: Renderer) {
    const dim = new PIXI.filters.ColorMatrixFilter();
    dim.brightness(0.5, false);

    const blur = new PIXI.filters.BlurFilter(16);
    this.container.filters = [blur, dim];

    renderer.bgStage.addChild(this.container);
    renderer.onResize(this.resize);
  }

  private resize = (width: number, height: number) => {
    this.container.position.set(width / 2, height / 2);
    if (this.background != null) {
      const scale = Math.max(
        width / this.background.texture.width,
        height / this.background.texture.height
      );
      this.background.scale.set(scale);
    }
  };

  async loadBeatmap(bgFile: Blob) {
    const image = new Image();

    const bgURL = URL.createObjectURL(bgFile);
    image.addEventListener('load', () => URL.revokeObjectURL(bgURL));
    image.src = bgURL;

    const res = new PIXI.ImageResource(image);
    await res.load();
    const base = new PIXI.BaseTexture(res);
    const texture = new PIXI.Texture(base);
    this.background = new PIXI.Sprite(texture);
    this.background.anchor.set(0.5, 0.5);
    this.resize(window.innerWidth, window.innerHeight);

    this.container.removeChildren();
    this.container.addChild(this.background);
  }
}
