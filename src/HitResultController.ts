import * as PIXI from 'pixi.js';
import { initSprite } from './HitObjects';
import Skin from './Skin';
import { clerp, clerp01 } from './util';

export enum HitResultType {
  MISS,
  HIT50,
  HIT100,
  HIT300
}

class HitResult {
  sprite: PIXI.Sprite;

  constructor(
    texture: PIXI.Texture | undefined,
    position: PIXI.Point,
    diameter: number,
    public type: HitResultType,
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

  reset(position: PIXI.Point, t: number) {
    this.t = t;
    this.sprite.position.copyFrom(position);
    this.sprite.visible = true;
    this.sprite.alpha = 0;
  }
}

export default class HitResultController {
  diameter: number = 0;

  free: Record<HitResultType, HitResult[]> = {
    [HitResultType.MISS]: [],
    [HitResultType.HIT50]: [],
    [HitResultType.HIT100]: [],
    [HitResultType.HIT300]: []
  };
  used: HitResult[] = [];

  constructor(private stage: PIXI.Container, private skin: Skin) {}

  loadDiameter(diameter: number) {
    this.diameter = diameter;
  }

  addResult(type: HitResultType, position: PIXI.Point, t: number) {
    if (this.free[type].length > 0) {
      const result = this.free[type].pop()!;
      result.reset(position, t);
      this.used.push(result);
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
