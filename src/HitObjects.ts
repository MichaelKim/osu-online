import * as PIXI from 'pixi.js';
import { Skin } from './Skin';

export enum ObjectTypes {
  HIT_CIRCLE = 1 << 0,
  SLIDER = 1 << 1,
  NEW_COMBO = 1 << 2,
  SPINNER = 1 << 3,
  COMBO_SKIP = (1 << 4) | (1 << 5) | (1 << 6)
}

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

// Common sprite initialization
export function initSprite(
  texture: PIXI.Texture,
  x: number,
  y: number,
  size: number
) {
  const sprite = new PIXI.Sprite(texture);
  sprite.position.set(x, y);
  sprite.scale.set(size / texture.width);
  sprite.visible = false;
  sprite.alpha = 0;
  return sprite;
}

// Convert number into array of sprites, centered at (x, y)
export function getNumberSprites(
  skin: Skin,
  number: number,
  x: number,
  y: number,
  circleSize: number
) {
  const sprites: PIXI.Sprite[] = [];
  const length = Math.floor(Math.log10(number) + 1);

  // TODO: assuming each digit has the same size
  const scale = circleSize / 160;
  const width = (skin.numbers[0].width - skin.hitCircleOverlap) * scale;
  let digitX = x + ((length - 1) * width) / 2;
  while (number > 0) {
    const sprite = new PIXI.Sprite(skin.numbers[number % 10]);
    sprite.scale.set(scale);
    sprite.position.set(digitX, y);
    sprite.visible = false;
    sprite.alpha = 0;
    sprites.push(sprite);

    digitX -= width;
    number = Math.floor(number / 10);
  }

  return sprites;
}

// Approach circle size multiplier
export const APPROACH_R = 2.5;

// Follow circle size multipler
export const FOLLOW_R = 2.4;
