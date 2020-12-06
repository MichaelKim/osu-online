import * as PIXI from 'pixi.js';
import { Tuple } from './util';

// Filepaths to each asset
const assets = {
  cursor: 'assets/cursor.png',
  circle: 'assets/hitcircle.png',
  overlay: 'assets/hitcircleoverlay.png',
  approach: 'assets/approachcircle.png',
  default0: 'assets/default-0.png',
  default1: 'assets/default-1.png',
  default2: 'assets/default-2.png',
  default3: 'assets/default-3.png',
  default4: 'assets/default-4.png',
  default5: 'assets/default-5.png',
  default6: 'assets/default-6.png',
  default7: 'assets/default-7.png',
  default8: 'assets/default-8.png',
  default9: 'assets/default-9.png'
};

type Resources = Record<keyof typeof assets, PIXI.LoaderResource>;

function loadHitCircle(
  renderer: PIXI.Renderer,
  circleTexture: PIXI.Texture,
  overlayTexture: PIXI.Texture
) {
  const circle = new PIXI.Sprite(circleTexture);
  const overlay = new PIXI.Sprite(overlayTexture);
  circle.anchor.set(0.5);
  overlay.anchor.set(0.5);

  const width = Math.max(circle.width, overlay.width);
  const height = Math.max(circle.height, overlay.height);
  circle.position.set(width / 2, height / 2);
  overlay.position.set(width / 2, height / 2);

  const texture = PIXI.RenderTexture.create({ width, height });
  texture.defaultAnchor.set(0.5);

  renderer.render(circle, texture);
  renderer.render(overlay, texture, false);

  return texture;
}

export class Skin {
  cursor: PIXI.Texture;

  // Hit circle
  circle: PIXI.Texture;
  approach: PIXI.Texture;

  // Numbers
  numbers: Tuple<PIXI.Texture, 10>;

  load(renderer: PIXI.Renderer) {
    return new Promise<void>(resolve => {
      PIXI.Loader.shared
        .add(
          Object.entries(assets).map(([name, url]) => ({
            name,
            url
          }))
        )
        .load((_, resources: Partial<Resources>) => {
          // TODO: check for missing / error texture
          this.cursor = resources.cursor.texture;
          this.approach = resources.approach.texture;
          this.circle = loadHitCircle(
            renderer,
            resources.circle.texture,
            resources.overlay.texture
          );
          this.numbers = [
            resources.default0.texture,
            resources.default1.texture,
            resources.default2.texture,
            resources.default3.texture,
            resources.default4.texture,
            resources.default5.texture,
            resources.default6.texture,
            resources.default7.texture,
            resources.default8.texture,
            resources.default9.texture
          ];

          // Center textures
          this.cursor.defaultAnchor.set(0.5);
          this.approach.defaultAnchor.set(0.5);
          this.numbers.forEach(n => n.defaultAnchor.set(0.5));

          resolve();
        });
    });
  }
}
