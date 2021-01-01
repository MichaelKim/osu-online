import * as PIXI from 'pixi.js';
import { initSprite } from './HitObjects';
import { Skin } from './Skin';

class FollowTrail {
  prev: PIXI.Point;
  next: PIXI.Point;
  prevT: number;
  nextT: number;

  points: PIXI.Sprite[] = [];

  constructor(
    texture: PIXI.Texture,
    prev: PIXI.Point,
    next: PIXI.Point,
    prevT: number,
    nextT: number
  ) {
    this.prev = prev;
    this.next = next;
    this.prevT = prevT;
    this.nextT = nextT;

    // Calculate intermediate points
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const dist = Math.hypot(dx, dy);
    const numPoints = Math.floor(dist / 50); // TODO: find better interval

    const angle = Math.atan2(dy, dx);

    const step = 1 / (numPoints + 1);

    for (let i = 1; i <= numPoints; i++) {
      const x = prev.x + dx * step * i;
      const y = prev.y + dy * step * i;
      // TODO: size according to circle size
      const sprite = initSprite(texture, x, y);
      sprite.rotation = angle;
      sprite.alpha = 1;
      sprite.visible = true;
      this.points.push(sprite);
    }
  }

  update(time: number) {
    // TODO: animation
    return time > this.nextT;
  }
}

export default class FollowPointController {
  stage: PIXI.Container;
  texture: PIXI.Texture;

  trails: FollowTrail[] = [];

  constructor(stage: PIXI.Container, skin: Skin) {
    this.texture = skin.followPoint;
    this.stage = stage;
  }

  update(time: number) {
    for (let i = 0; i < this.trails.length; i++) {
      if (this.trails[i].update(time)) {
        this.stage.removeChild(...this.trails[i].points);
        this.trails[i] = this.trails[this.trails.length - 1];
        this.trails.pop();
      }
    }
  }

  addTrail(prev: PIXI.Point, next: PIXI.Point, prevT: number, nextT: number) {
    // Going from point a at time t1 to point b at time t2
    const trail = new FollowTrail(this.texture, prev, next, prevT, nextT);
    if (trail.points.length > 0) {
      this.trails.push(trail);
      this.stage.addChild(...trail.points);
    }
  }
}
