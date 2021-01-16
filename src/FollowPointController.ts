import * as PIXI from 'pixi.js';
import { HitObject, HitObjectTypes, initSprite } from './HitObjects';
import { Skin } from './Skin';
import { clerp01 } from './util';

const POINT_FADE = 375; // Follow point fade in/out duration in ms

class FollowTrail {
  container: PIXI.Container;
  points: PIXI.Sprite[] = [];
  firstFade: number;
  lastFade: number;

  constructor(
    texture: PIXI.Texture,
    prev: PIXI.Point,
    next: PIXI.Point,
    prevT: number,
    nextT: number
  ) {
    this.container = new PIXI.Container();
    this.container.visible = false;

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
      const sprite = initSprite(texture, new PIXI.Point(x, y));
      sprite.rotation = angle;
      this.points.push(sprite);
      this.container.addChild(sprite);
    }

    const dt = nextT - prevT;
    this.firstFade = prevT - 780 + 0.15 * dt;
    this.lastFade = this.firstFade + 0.7 * dt;
  }

  update(time: number) {
    // TODO: individual point fade in / out
    if (time < this.firstFade) return false;

    if (time < this.firstFade + 800) {
      const alpha = clerp01(time - this.firstFade, 0, POINT_FADE);
      this.container.visible = true;
      this.container.alpha = alpha;
      return false;
    }

    if (time < this.firstFade + 800 + POINT_FADE) {
      const alpha = 1 - clerp01(time - this.firstFade - 800, 0, POINT_FADE);
      this.container.visible = true;
      this.container.alpha = alpha;
      return false;
    }

    this.container.visible = false;
    this.container.alpha = 0;
    return true;
  }
}

function loadFollowTrails(notes: HitObject[], skin: Skin) {
  const trails: FollowTrail[] = [];

  for (let i = 0; i < notes.length - 1; i++) {
    const prev = notes[i];
    const next = notes[i + 1];

    if (next.type !== HitObjectTypes.SPINNER && next.o.comboNumber !== 1) {
      if (prev.type === HitObjectTypes.HIT_CIRCLE) {
        const trail = new FollowTrail(
          skin.followPoint,
          prev.start,
          next.start,
          prev.o.t,
          next.o.t
        );
        if (trail.points.length > 0) {
          trails.push(trail);
        }
      } else if (prev.type === HitObjectTypes.SLIDER) {
        const prevStart = prev.o.slides % 2 === 0 ? prev.start : prev.end;
        const trail = new FollowTrail(
          skin.followPoint,
          prevStart,
          next.start,
          prev.endTime,
          next.o.t
        );
        if (trail.points.length > 0) {
          trails.push(trail);
        }
      }
    }
  }

  return trails;
}

export default class FollowPointController {
  trails: FollowTrail[] = [];
  left: number = 0;
  right: number = 0;

  constructor(private stage: PIXI.Container, notes: HitObject[], skin: Skin) {
    this.trails = loadFollowTrails(notes, skin);
    this.trails.forEach(t => this.stage.addChild(t.container));
  }

  update(time: number) {
    // Check for new trails
    while (
      this.right < this.trails.length &&
      time > this.trails[this.right].firstFade
    ) {
      this.trails[this.right].container.visible = true;
      this.right++;
    }

    // Update trail
    while (this.left < this.right && this.trails[this.left].update(time)) {
      // Don't have to update anymore
      this.trails[this.left].container.visible = false;
      this.left++;
    }
    for (let i = this.left + 1; i < this.right; i++) {
      this.trails[i].update(time);
    }
  }
}
