import * as PIXI from 'pixi.js';
import { initSprite } from './HitObjects';
import Skin from './Skin';
import { clerp01 } from './util';

export enum HitResultType {
  MISS,
  HIT50,
  HIT100,
  HIT300
}

class HitResult {
  sprite: PIXI.Sprite;

  constructor(
    texture: PIXI.Texture,
    position: PIXI.Point,
    diameter: number,
    public type: HitResultType,
    private t: number
  ) {
    this.sprite = initSprite(texture, position, diameter);
    this.sprite.alpha = 0;
    this.sprite.visible = true;
  }

  update(time: number) {
    // TODO: more detailed animation
    const delta = time - this.t;
    if (delta < 0) this.sprite.alpha = 0;
    else if (delta < 900) this.sprite.alpha = 1;
    else if (delta < 1000) this.sprite.alpha = 1 - clerp01(delta, 900, 1000);
    else {
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
