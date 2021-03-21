import { Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { initSprite } from './HitObjects';
import Skin from './Skin';
import { clerp, clerp01 } from './util';

export enum HitResultType {
  MISS,
  HIT50,
  HIT100,
  HIT300,
  TICK_HIT,
  TICK_MISS,
  EDGE_HIT,
  EDGE_MISS,
  LAST_EDGE_HIT,
  LAST_EDGE_MISS,
  SPIN_TICK,
  SPIN_BONUS
}

export type HitCircleHitResultType =
  | HitResultType.MISS
  | HitResultType.HIT50
  | HitResultType.HIT100
  | HitResultType.HIT300;

class HitResult {
  sprite: Sprite;

  constructor(
    texture: Texture,
    position: Point,
    diameter: number,
    public type: HitCircleHitResultType,
    private t: number
  ) {
    this.sprite = initSprite(texture, position, diameter);
    this.sprite.alpha = 0;
    this.sprite.visible = true;
    this.sprite.scale.set(0.6);
  }

  update(time: number) {
    const delta = time - this.t;

    // Misses rotate slightly
    if (this.type === HitResultType.MISS) {
      this.sprite.angle = clerp(delta, 0, 1000, 0, -5);
    }

    this.sprite.scale.set(clerp(delta, 0, 1000, 0.6, 0.7));

    if (delta < 0) this.sprite.alpha = 0;
    else if (delta < 100) {
      this.sprite.alpha = clerp01(delta, 0, 100);
    } else if (delta < 1000) {
      this.sprite.alpha = 1 - clerp01(delta, 100, 1000);
    } else {
      this.sprite.alpha = 0;
      return true;
    }

    return false;
  }

  clean() {
    this.sprite.visible = false;
    this.sprite.alpha = 0;
  }

  reset(position: Point, t: number) {
    this.t = t;
    this.sprite.position.copyFrom(position);
    this.sprite.visible = true;
    this.sprite.alpha = 0;
  }
}

export default class HitResultController {
  diameter = 0;

  free: Record<HitCircleHitResultType, HitResult[]> = {
    [HitResultType.MISS]: [],
    [HitResultType.HIT50]: [],
    [HitResultType.HIT100]: [],
    [HitResultType.HIT300]: []
  };
  used: HitResult[] = [];

  constructor(private stage: Container, private skin: Skin) {}

  loadDiameter(diameter: number) {
    this.diameter = diameter;
  }

  reset() {
    for (let i = 0; i < this.used.length; i++) {
      const result = this.used[i];
      result.clean();
      this.free[result.type].push(result);
      this.used[i] = this.used[this.used.length - 1];
      this.used.pop();
      i--;
    }
  }

  addResult(type: HitCircleHitResultType, position: Point, t: number) {
    if (this.free[type].length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const result = this.free[type].pop()!;
      result.reset(position, t);
      this.used.push(result);
      // Move to end (assume adding latest hit result)
      const idx = this.stage.getChildIndex(result.sprite);
      this.stage.children.splice(idx, 1);
      this.stage.children.push(result.sprite);
    } else {
      const result = new HitResult(
        this.skin.hits[type],
        position,
        this.diameter,
        type,
        t
      );
      this.stage.addChild(result.sprite);
      this.used.push(result);
    }
  }

  update(time: number) {
    for (let i = 0; i < this.used.length; i++) {
      const result = this.used[i];
      if (result.update(time)) {
        result.clean();
        this.free[result.type].push(result);
        this.used[i] = this.used[this.used.length - 1];
        this.used.pop();
        i--;
      }
    }
  }
}
