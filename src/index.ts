import * as PIXI from 'pixi.js';
import initLock, { lockPointer } from './lock';
import initStart from './start';
import { clamp, lerp } from './util';

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  view: document.getElementsByTagName('canvas')[0]
});

const notes = [
  { x: 100, y: 200, t: 2000 },
  { x: 300, y: 200, t: 4000 },
  { x: 500, y: 200, t: 6000 },
  { x: 700, y: 200, t: 8000 },
  { x: 900, y: 200, t: 10000 }
];

const CS = 3;
// TODO: update radius on resize
const r = (app.screen.width / 16) * (1.7 - CS * 0.14);
const approachR = 2.5; // Estimate initial approach circle size
const AR = 5;
const fadeIn = 1800 - AR * 120; // When the note starts fading in
const full = 600 - AR * 40; // When the note is fully visible
const OD = 5;
const window50 = 199.5 - OD * 10;
const window100 = 139.5 - OD * 8;
const window300 = 79.5 - OD * 6;

type Resources<T> = Record<keyof T, PIXI.LoaderResource>;

function loadTextures<T extends Record<string, string>>(
  urls: T
): Promise<Resources<T>> {
  return new Promise<Resources<T>>(resolve => {
    PIXI.Loader.shared
      .add(
        Object.entries(urls).map(([name, url]) => ({
          name,
          url
        }))
      )
      // TODO: Partial?
      .load((loader, resources: Resources<T>) => resolve(resources));
  });
}

const assets = {
  cursor: 'assets/cursor.png',
  circle: 'assets/hitcircle.png',
  overlay: 'assets/hitcircleoverlay.png',
  approach: 'assets/approachcircle.png'
};

initLock(app);

loadTextures(assets).then(resources => {
  initStart().then(() => {
    const container = new PIXI.Container();

    app.stage.addChild(container);

    // Create a 5x5 grid of bunnies
    for (let i = 0; i < 25; i++) {
      const bunny = new PIXI.Sprite(resources.cursor.texture);
      bunny.x = (i % 5) * 40;
      bunny.y = Math.floor(i / 5) * 40;
      container.addChild(bunny);
    }

    // Move container to the center
    container.x = app.screen.width / 2;
    container.y = app.screen.height / 2;

    // Center bunny sprite in local container coordinates
    container.pivot.x = container.width / 2;
    container.pivot.y = container.height / 2;

    // Listen for animate update
    app.ticker.add(delta => {
      // rotate the container!
      // use delta to create frame-independent transform
      container.rotation -= 0.01 * delta;
    });

    window.addEventListener('resize', () => {
      container.x = window.innerWidth / 2;
      container.y = window.innerHeight / 2;
    });

    init(resources);
  });
});

function loadHitCircle(resources: Resources<typeof assets>) {
  const circle = new PIXI.Sprite(resources.circle.texture);
  const overlay = new PIXI.Sprite(resources.overlay.texture);
  circle.anchor.set(0.5);
  overlay.anchor.set(0.5);

  const width = Math.max(circle.width, overlay.width);
  const height = Math.max(circle.height, overlay.height);
  circle.position.set(width / 2, height / 2);
  overlay.position.set(width / 2, height / 2);

  const texture = PIXI.RenderTexture.create({ width, height });
  texture.defaultAnchor.set(0.5);

  app.renderer.render(circle, texture);
  app.renderer.render(overlay, texture, false);

  return texture;
}

function init(resources: Resources<typeof assets>) {
  app.view.style.display = 'block';
  app.stage.interactive = true;

  lockPointer(app);
  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  app.stage.on('mousemove', (e: PIXI.InteractionEvent) => {
    const { movementX, movementY } = e.data.originalEvent as MouseEvent;
    cursor.x = clamp(cursor.x + movementX, 0, app.screen.width);
    cursor.y = clamp(cursor.y + movementY, 0, app.screen.height);
  });

  const hitCircleTexture = loadHitCircle(resources);
  const circles = notes.map(n => {
    const sprite = new PIXI.Sprite(hitCircleTexture);
    sprite.position.set(n.x, n.y);
    sprite.width = r * 2;
    sprite.height = r * 2;
    sprite.visible = false;
    sprite.alpha = 0;
    return sprite;
  });
  app.stage.addChild(...circles);

  resources.approach.texture.defaultAnchor.set(0.5);
  const approaches = notes.map(n => {
    const sprite = new PIXI.Sprite(resources.approach.texture);
    sprite.position.set(n.x, n.y);
    sprite.width = r * 2 * approachR;
    sprite.height = r * 2 * approachR;
    sprite.visible = false;
    sprite.alpha = 0;
    return sprite;
  });
  app.stage.addChild(...approaches);

  const cursor = new PIXI.Sprite(resources.cursor.texture);
  cursor.position.set(app.screen.width / 2, app.screen.height / 2);
  cursor.anchor.set(0.5);
  app.stage.addChild(cursor);

  // Keep track of two indices
  // - left: Note to click
  // - right: Earliest note not visible yet
  // All notes to be updated / visible: [left, right)
  const ticker = new PIXI.Ticker();
  let time = 0;
  let left = 0,
    right = 0;
  ticker.add(() => {
    time += ticker.deltaMS;

    if (right < notes.length && time > notes[right].t - fadeIn) {
      // New note to show
      circles[right].visible = true;
      approaches[right].visible = true;
      right++;
    }

    // Check for missed notes
    if (left < right && time > notes[left].t + window50) {
      circles[left].visible = false;
      approaches[left].visible = false;
      left++;
      console.log('miss');
    }

    // Update opacity of fading notes
    for (let i = left; i < right; i++) {
      // TODO: don't update for fully opaque notes
      circles[i].alpha = clamp(
        lerp(time, notes[i].t - fadeIn, notes[i].t - full, 0, 1),
        0,
        1
      );
      approaches[i].alpha = clamp(
        lerp(time, notes[i].t - fadeIn, notes[i].t - full, 0, 1),
        0,
        1
      );

      // Update approach circle sizes
      const size =
        r *
        2 *
        clamp(
          lerp(time, notes[i].t - fadeIn, notes[i].t, approachR, 1),
          1,
          approachR
        );
      approaches[i].width = size;
      approaches[i].height = size;
    }
  });
  ticker.start();

  app.view.addEventListener('mousedown', () => {
    if (left >= right) return;

    const dx = cursor.x - circles[left].x;
    const dy = cursor.y - circles[left].y;
    if (dx * dx + dy * dy < r * r) {
      const dt = Math.abs(time - notes[left].t);
      circles[left].visible = false;
      approaches[left].visible = false;
      left++;

      if (dt <= window300) console.log('300');
      else if (dt <= window100) console.log('100');
      else console.log('50');
    }
  });
}
