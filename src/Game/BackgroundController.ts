import { BaseTexture, ImageResource, Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { BlurFilter } from '@pixi/filter-blur';
import { ColorMatrixFilter } from '@pixi/filter-color-matrix';
import { Sprite } from '@pixi/sprite';
import Renderer from './Renderer';

export default class BackgroundController {
  private container = new Container();
  private background?: Sprite;

  constructor(renderer: Renderer) {
    const dim = new ColorMatrixFilter();
    dim.brightness(0.5, false);

    const blur = new BlurFilter(16);
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

    const res = new ImageResource(image);
    await res.load();
    const base = new BaseTexture(res);
    const texture = new Texture(base);
    this.background = new Sprite(texture);
    this.background.anchor.set(0.5, 0.5);
    this.resize(window.innerWidth, window.innerHeight);

    this.container.removeChildren();
    this.container.addChild(this.background);
  }
}
