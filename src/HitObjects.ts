import * as PIXI from 'pixi.js';
import { Skin } from './Skin';

export interface Stats {
  ar: number;
  od: number;
  cs: number;
  sliderMultiplier: number;
}

export enum HitSound {
  NORMAL = 1 << 0,
  WHISTLE = 1 << 1,
  FINISH = 1 << 2,
  CLAP = 1 << 3
}

// Convert number into array of sprites, centered at (x, y)
export function getNumberSprites(
  skin: Skin,
  number: number,
  x: number,
  y: number
) {
  const sprites: PIXI.Sprite[] = [];
  const length = Math.floor(Math.log10(number) + 1);

  // Downscale numbers by 0.8x
  const width = (skin.numbers[0].width - skin.hitCircleOverlap) * 0.8;
  let digitX = x + ((length - 1) * width) / 2;
  while (number > 0) {
    const sprite = new PIXI.Sprite(skin.numbers[number % 10]);
    sprite.scale.set(0.8);
    sprite.position.set(digitX, y);
    sprite.visible = false;
    sprite.alpha = 0;
    sprites.push(sprite);

    digitX -= width;
    number = Math.floor(number / 10);
  }

  // TODO: do rendertextures automatically scale?
  // const texture = PIXI.RenderTexture.create({
  //   width: width * sprites.length,
  //   height: sprites[0].height
  // });
  // texture.defaultAnchor.set(0.5);
  // sprites.forEach(s => renderer.render(s, texture, false));

  return sprites;
}
