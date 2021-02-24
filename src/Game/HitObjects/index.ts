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

  circle.scale.set(size / HIT_CIRCLE_DIAMETER);
  overlay.scale.set(size / HIT_CIRCLE_DIAMETER);

  const circleSprite = new PIXI.Container();
  circleSprite.position.copyFrom(position);
  circleSprite.addChild(circle, overlay);

  return circleSprite;
}

// Common sprite initialization
export function initSprite(
  texture?: PIXI.Texture,
  position: PIXI.IPointData = { x: 0, y: 0 },
  size = 0
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
  container.scale.set(diameter / 160);

  const width = (skin.numbers[0]?.width ?? 0) - skin.hitCircleOverlap;
  const length = Math.floor(Math.log10(number) + 1);
  const lastDigitX = (length - 1) / 2;
  for (let i = 0; number > 0; i++) {
    const sprite = new PIXI.Sprite(skin.numbers[number % 10]);
    sprite.position.set((lastDigitX - i) * width, 0);
    container.addChild(sprite);

    number = Math.floor(number / 10);
  }

  return container;
}

// Hit circle sprite size
export const HIT_CIRCLE_DIAMETER = 128;

// Approach circle size multiplier
export const APPROACH_R = 2.5;

// Follow circle size multipler
export const FOLLOW_R = 2.4;

// Duration for fading out hit objects
export const FADE_OUT_MS = 250; // Hit circle
export const SLIDER_FADE_OUT_MS = 50; // Slider

// Stack offset (fraction of circle diameter)
export const STACK_OFFSET_MULT = 20;
