import * as PIXI from 'pixi.js';
import initLock, { lockPointer } from './lock';
import initStart from './start';
import { clamp } from './util';
import { Skin } from './skin';
import Beatmap from './beatmap';
import HitCircle from './hitcircle';

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  view: document.getElementsByTagName('canvas')[0]
});

const skin = new Skin();

initLock(app);
initStart()
  .then(() =>
    skin.load(app, {
      cursor: 'assets/cursor.png',
      circle: 'assets/hitcircle.png',
      overlay: 'assets/hitcircleoverlay.png',
      approach: 'assets/approachcircle.png'
    })
  )
  .then(() => {
    const container = new PIXI.Container();

    app.stage.addChild(container);

    // Create a 5x5 grid of bunnies
    const texture = PIXI.Texture.from('assets/cursor.png');
    for (let i = 0; i < 25; i++) {
      const bunny = new PIXI.Sprite(texture);
      bunny.anchor.set(0);
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
  })
  .then(init);

function loadCursor(texture: PIXI.Texture) {
  const cursor = new PIXI.Sprite(texture);
  cursor.position.set(app.screen.width / 2, app.screen.height / 2);
  app.stage.addChild(cursor);
  app.stage.on('mousemove', (e: PIXI.InteractionEvent) => {
    const { movementX, movementY } = e.data.originalEvent as MouseEvent;
    cursor.x = clamp(cursor.x + movementX, 0, app.screen.width);
    cursor.y = clamp(cursor.y + movementY, 0, app.screen.height);
  });
  return cursor;
}

function init() {
  app.view.style.display = 'block';
  app.stage.interactive = true;
  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });
  lockPointer(app);

  const notes = [
    { x: 100, y: 200, t: 2000 },
    { x: 300, y: 200, t: 4000 },
    { x: 500, y: 200, t: 6000 },
    { x: 700, y: 200, t: 8000 },
    { x: 900, y: 200, t: 10000 }
  ].map(n => new HitCircle(n.x, n.y, n.t));

  const beatmap = new Beatmap([
    {
      notes,
      stats: {
        ar: 5,
        od: 5,
        cs: 5
      }
    }
  ]);

  beatmap.load(skin, 0);

  notes.forEach(n => {
    app.stage.addChild(n.circleSprite, n.approachSprite);
  });

  const cursor = loadCursor(skin.cursor);
  const ticker = new PIXI.Ticker();
  let time = 0;
  ticker.add(() => {
    time += ticker.deltaMS;
    beatmap.update(time);
  });
  ticker.start();

  app.view.addEventListener('mousedown', () => {
    beatmap.click(time, cursor.x, cursor.y);
  });
}
