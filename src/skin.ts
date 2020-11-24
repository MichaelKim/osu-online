import * as PIXI from 'pixi.js';

// Filepaths to each asset
type SkinData = Partial<{
  cursor: string;
  circle: string;
  overlay: string;
  approach: string;
}>;

type Resources = Record<keyof SkinData, PIXI.LoaderResource>;

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

  load(renderer: PIXI.Renderer, data: SkinData) {
    return new Promise<void>(resolve => {
      PIXI.Loader.shared
        .add(
          Object.entries(data).map(([name, url]) => ({
            name,
            url
          }))
        )
        .load((loader, resources: Partial<Resources>) => {
          // TODO: check for missing / error texture
          this.cursor = resources.cursor.texture;
          this.approach = resources.approach.texture;
          this.circle = loadHitCircle(
            renderer,
            resources.circle.texture,
            resources.overlay.texture
          );

          // Center textures
          this.cursor.defaultAnchor.set(0.5);
          this.approach.defaultAnchor.set(0.5);

          resolve();
        });
    });
  }
}
