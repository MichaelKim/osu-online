import * as PIXI from 'pixi.js';
import { initSprite } from './HitObjects';
import Renderer from './Renderer';
import { Skin } from './Skin';
import { clerp01 } from './util';

export enum HitResultType {
  MISS,
  HIT50,
  HIT100,
  HIT300
}

class HitResult {
  sprite: PIXI.Sprite;
  type: HitResultType;
  t: number;

  constructor(
    texture: PIXI.Texture,
    x: number,
    y: number,
    diameter: number,
    type: HitResultType,
    t: number
  ) {
    this.sprite = initSprite(texture, x, y, diameter);
    this.sprite.alpha = 0;
    this.sprite.visible = true;
    this.type = type;
    this.t = t;
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

  reset(x: number, y: number, t: number) {
    this.t = t;
    this.sprite.position.set(x, y);
    this.sprite.visible = true;
    this.sprite.alpha = 0;
  }
}

export default class HitResultController {
  skin: Skin;
  stage: PIXI.Container;
  diameter: number;

  free: Record<HitResultType, HitResult[]> = {
    [HitResultType.MISS]: [],
    [HitResultType.HIT50]: [],
    [HitResultType.HIT100]: [],
    [HitResultType.HIT300]: []
  };
  used: HitResult[] = [];

  constructor(stage: PIXI.Container, skin: Skin) {
    this.skin = skin;
    this.stage = stage;
  }

  loadDiameter(diameter: number) {
    this.diameter = diameter;
  }

  addResult(type: HitResultType, x: number, y: number, t: number) {
    if (this.free[type].length > 0) {
      const result = this.free[type].pop();
      result.reset(x, y, t);
      this.used.push(result);
    } else {
      const result = new HitResult(
        this.skin.hits[type],
        x,
        y,
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
