import * as PIXI from 'pixi.js';
import { HitObject, HitObjectTypes, initSprite } from './HitObjects';
import Skin from './Skin';
import { clerp01, lerp } from './util';

const SPACING = 32;
const PREEMPT = 800;
const FADE_DURATION = 400;

// A single follow point
class FollowPoint {
  sprite: PIXI.Sprite;

  constructor(
    texture: PIXI.Texture | undefined,
    private start: PIXI.Point,
    private end: PIXI.Point,
    angle: number,
    public fadeInTime: number,
    private fadeOutTime: number,
    private size: number
  ) {
    this.sprite = initSprite(texture, start);
    this.sprite.rotation = angle;
    this.sprite.scale.set((1.5 * size) / 128);
    this.sprite.alpha = 0;
    this.sprite.visible = false;
  }

  update(time: number) {
    /*
    [fadeInTime, fadeInTime + 400]: fade in
    [fadeInTime, fadeInTime + 400]: scale from 1.5 to 1
    [fadeInTime, fadeInTime + 400]: move from position to endPosition
    [fadeOutTime, fadeOutTime + 400]: fade out
    */
    if (time < this.fadeInTime) return false;

    if (time < this.fadeOutTime) {
      const t = clerp01(time, this.fadeInTime, this.fadeInTime + FADE_DURATION);
      this.sprite.alpha = t;

      const scale = lerp(t, 0, 1, 1.5, 1);
      this.sprite.scale.set((scale * this.size) / 128);

      const x = lerp(t, 0, 1, this.start.x, this.end.x);
      const y = lerp(t, 0, 1, this.start.y, this.end.y);
      this.sprite.position.set(x, y);
      return false;
    }

    const t =
      1 - clerp01(time, this.fadeOutTime, this.fadeOutTime + FADE_DURATION);
    this.sprite.alpha = t;

    return time > this.fadeOutTime + FADE_DURATION;
  }
}

function generatePoints(
  texture: PIXI.Texture | undefined,
  prev: PIXI.Point,
  next: PIXI.Point,
  prevT: number,
  nextT: number,
  size: number
) {
  const points: FollowPoint[] = [];

  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const duration = nextT - prevT;

  // Calculate intermediate points
  for (let d = Math.floor(SPACING * 1.5); d < dist - SPACING; d += SPACING) {
    const t = d / dist;
    const pointStartPosition = new PIXI.Point(
      prev.x + (t - 0.1) * dx,
      prev.y + (t - 0.1) * dy
    );
    const pointEndPosition = new PIXI.Point(prev.x + t * dx, prev.y + t * dy);
    const fadeOutTime = prevT + t * duration;
    const fadeInTime = fadeOutTime - PREEMPT;

    points.push(
      new FollowPoint(
        texture,
        pointStartPosition,
        pointEndPosition,
        angle,
        fadeInTime,
        fadeOutTime,
        size
      )
    );
  }

  return points;
}

function loadFollowTrails(notes: HitObject[], skin: Skin) {
  const points: FollowPoint[] = [];

  for (let i = 0; i < notes.length - 1; i++) {
    const prev = notes[i];
    const next = notes[i + 1];

    if (next.type !== HitObjectTypes.SPINNER && next.o.comboNumber !== 1) {
      if (prev.type === HitObjectTypes.HIT_CIRCLE) {
        const trail = generatePoints(
          skin.followPoint,
          prev.start,
          next.start,
          prev.endTime,
          next.o.t,
          next.size
        );
        points.push(...trail);
      } else if (prev.type === HitObjectTypes.SLIDER) {
        const prevStart = prev.o.slides % 2 === 0 ? prev.start : prev.end;
        const trail = generatePoints(
          skin.followPoint,
          prevStart,
          next.start,
          prev.endTime,
          next.o.t,
          next.size
        );
        points.push(...trail);
      }
    }
  }

  return points;
}

export default class FollowPointController {
  points: FollowPoint[] = [];
  left: number = 0;
  right: number = 0;

  constructor(private stage: PIXI.Container, notes: HitObject[], skin: Skin) {
    this.points = loadFollowTrails(notes, skin);
    this.points.forEach(p => this.stage.addChild(p.sprite));
  }

  update(time: number) {
    // Check for new points
    while (
      this.right < this.points.length &&
      time >= this.points[this.right].fadeInTime
    ) {
      this.points[this.right].sprite.visible = true;
      this.right++;
    }

    // Update points
    while (this.left < this.right && this.points[this.left].update(time)) {
      // Don't have to update anymore
      this.points[this.left].sprite.visible = false;
      this.left++;
    }
    for (let i = this.left + 1; i < this.right; i++) {
      this.points[i].update(time);
    }
  }
}
