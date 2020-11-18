import * as PIXI from 'pixi.js';
import initLock, { lockPointer } from './lock';
import initStart from './start';

const app = new PIXI.Application({
  width: window.innerWidth,
  height: window.innerHeight,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
  view: document.getElementsByTagName('canvas')[0]
});

initStart().then(init);
initLock(app);

function init() {
  app.view.style.display = 'block';

  lockPointer(app);

  app.stage.interactive = true;

  const container = new PIXI.Container();

  app.stage.addChild(container);

  // Create a new texture
  const texture = PIXI.Texture.from('assets/cursor.png');

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new PIXI.Sprite(texture);
    bunny.anchor.set(0.5);
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

  const cursor = new PIXI.Sprite(texture);
  cursor.anchor.set(0.5);
  app.stage.addChild(cursor);

  app.stage.on('pointermove', (e: PIXI.InteractionEvent) => {
    const { x, y } = e.data.global;
    cursor.x = x;
    cursor.y = y;
  });

  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    // Move container to the center
    container.x = window.innerWidth / 2;
    container.y = window.innerHeight / 2;
  });
}
