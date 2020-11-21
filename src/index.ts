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

function loadTextures(urls: Record<string, string>) {
  return PIXI.Loader.shared.add(
    Object.entries(urls).map(([name, url]) => ({
      name,
      url
    }))
  );
}

initLock(app);
loadTextures({
  cursor: 'assets/cursor.png',
  circle: 'assets/hitcircle.png',
  overlay: 'assets/hitcircleoverlay.png'
}).load((loader, resources) => {
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

function loadHitCircle(resources) {
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
const AR = 5;
const fadeIn = 1800 - AR * 120; // When the note starts fading in
const full = 600 - AR * 40; // When the note is fully visible
const OD = 5;
const window50 = 199.5 - OD * 10;
const window100 = 139.5 - OD * 8;
const window300 = 79.5 - OD * 6;

function init(resources) {
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
      right++;
    }

    // Check for missed notes
    if (left < right && time > notes[left].t + window50) {
      circles[left].visible = false;
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
    }
  });
  ticker.start();

  app.stage.on('pointerdown', () => {
    if (left >= right) return;

    const dx = cursor.x - circles[left].x;
    const dy = cursor.y - circles[left].y;
    if (dx * dx + dy * dy < r * r) {
      const dt = Math.abs(time - notes[left].t);
      circles[left].visible = false;
      left++;
      if (dt <= window300) console.log('300');
      else if (dt <= window100) console.log('100');
      else console.log('50');
    }
  });
}
