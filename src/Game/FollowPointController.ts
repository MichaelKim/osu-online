import { Texture } from '@pixi/core';
import { Container } from '@pixi/display';
import { Point } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { HitObject, HitObjectTypes, HIT_CIRCLE_DIAMETER } from './HitObjects';
import Skin from './Skin';
import { clerp01, lerp } from './util';

const SPACING = 32;
const PREEMPT = 800;
const FADE_DURATION = 400;

// A single follow point
class FollowPoint {
  sprite: Sprite;

  constructor(
    texture: Texture,
    private start: Point,
    private end: Point,
    private angle: number,
    public fadeInTime: number,
    private fadeOutTime: number,
    private size: number
  ) {
    this.sprite = new Sprite(texture);
    this.restart();
  }

  restart() {
    this.sprite.position.copyFrom(this.start);
    this.sprite.rotation = this.angle;
    this.sprite.scale.set((1.5 * this.size) / 128);
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
      this.sprite.scale.set((scale * this.size) / HIT_CIRCLE_DIAMETER);

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
  texture: Texture,
  prev: Point,
  next: Point,
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
    const pointStartPosition = new Point(
      prev.x + (t - 0.1) * dx,
      prev.y + (t - 0.1) * dy
    );
    const pointEndPosition = new Point(prev.x + t * dx, prev.y + t * dy);
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
          next.o.size
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
          next.o.size
        );
        points.push(...trail);
      }
    }
  }

  return points;
}

export default class FollowPointController {
  points: FollowPoint[] = [];
  left = 0;
  right = 0;

  constructor(private stage: Container, private skin: Skin) {}

  loadBeatmap(notes: HitObject[]) {
    this.points = loadFollowTrails(notes, this.skin);
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

  restart() {
    this.left = 0;
    this.right = 0;
    this.points.forEach(p => p.restart());
  }

  reset() {
    this.points.forEach(p => this.stage.removeChild(p.sprite));
    this.points = [];
    this.left = 0;
    this.right = 0;
  }
}
