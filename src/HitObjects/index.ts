import * as PIXI from 'pixi.js';
import HitCircle from './HitCircle';
import Skin from '../Skin';
import Slider from './Slider';
import Spinner from './Spinner';

// See https://github.com/Microsoft/TypeScript/issues/27976
export const enum HitObjectTypes {
  HIT_CIRCLE = 1, // 1 << 0,
  SLIDER = 2, // 1 << 1,
  NEW_COMBO = 4, // 1 << 2,
  SPINNER = 8, // 1 << 3,
  COMBO_SKIP = 112 // (1 << 4) | (1 << 5) | (1 << 6)
}

export type HitObject = HitCircle | Slider | Spinner;

// Initialize hit circle sprite
export function initCircleSprite(
  skin: Skin,
  color: number,
  position: PIXI.Point,
  size: number
) {
  const circle = new PIXI.Sprite(skin.circle);
  circle.tint = color;

  const overlay = new PIXI.Sprite(skin.overlay);

  const width = Math.max(circle.width, overlay.width);
  circle.scale.set(size / width);
  overlay.scale.set(size / width);

  const circleSprite = new PIXI.Container();
  circleSprite.position.copyFrom(position);
  circleSprite.addChild(circle, overlay);

  return circleSprite;
}

// Common sprite initialization
export function initSprite(
  texture?: PIXI.Texture,
  position: PIXI.Point = new PIXI.Point(),
  size: number = 0
) {
  const sprite = new PIXI.Sprite(texture);
  sprite.position.copyFrom(position);
  if (size > 0) {
    sprite.scale.set(size / sprite.texture.width);
  }
  return sprite;
}

// Convert number into array of sprites, centered at (x, y)
export function getNumberSprites(
  skin: Skin,
  number: number,
  position: PIXI.Point,
  diameter: number
) {
  // Add numbers to container centered at (x, y)
  const container = new PIXI.Container();
  container.position.copyFrom(position);

  const length = Math.floor(Math.log10(number) + 1);

  // TODO: assuming each digit has the same size
  const scale = diameter / 160;
  const width = (skin.numbers[0]?.width ?? 0 - skin.hitCircleOverlap) * scale;
  let digitX = ((length - 1) * width) / 2;
  while (number > 0) {
    const sprite = new PIXI.Sprite(skin.numbers[number % 10]);
    sprite.scale.set(scale);
    sprite.position.set(digitX, 0);
    container.addChild(sprite);

    digitX -= width;
    number = Math.floor(number / 10);
  }

  return container;
}

// Approach circle size multiplier
export const APPROACH_R = 2.5;

// Follow circle size multipler
export const FOLLOW_R = 2.4;

// Duration for fading out hit objects
export const FADE_OUT_MS = 250;

// Stack offset (fraction of circle diameter)
export const STACK_OFFSET_MULT = 20;
