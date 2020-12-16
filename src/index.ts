import * as PIXI from 'pixi.js';
import initLock from './lock';
import initStart from './start';
import { clamp } from './util';
import { Skin } from './Skin';
import BeatmapDifficulty from './BeatmapDifficulty';
import Game from './Game';

const game = new Game(document.getElementsByTagName('canvas')[0]);

const skin = new Skin('assets/skin.ini');

initLock(game.renderer.view);
initStart()
  .then(() => skin.load(game.renderer))
  .then(init);

function loadTest() {
  const container = new PIXI.Container();

  game.stage.addChildAt(container, 0);

  // Create a 5x5 grid of bunnies
  for (let i = 0; i < 25; i++) {
    const bunny = new PIXI.Sprite(skin.cursor);
    bunny.anchor.set(0);
    bunny.x = (i % 5) * 40;
    bunny.y = Math.floor(i / 5) * 40;
    container.addChild(bunny);
  }

  // Move container to the center
  container.x = game.renderer.screen.width / 2;
  container.y = game.renderer.screen.height / 2;

  // Center bunny sprite in local container coordinates
  container.pivot.x = container.width / 2;
  container.pivot.y = container.height / 2;

  // Listen for animate update
  const ticker = new PIXI.Ticker();
  ticker.add(delta => {
    // rotate the container!
    // use delta to create frame-independent transform
    container.rotation -= 0.01 * delta;
  }, PIXI.UPDATE_PRIORITY.LOW);
  ticker.start();

  window.addEventListener('resize', () => {
    container.x = window.innerWidth / 2;
    container.y = window.innerHeight / 2;
  });
}

function loadCursor(texture: PIXI.Texture) {
  const cursor = new PIXI.Sprite(texture);
  cursor.position.set(
    game.renderer.screen.width / 2,
    game.renderer.screen.height / 2
  );
  game.cursorStage.addChild(cursor);
  return cursor;
}

async function init() {
  // loadTest();
  game.init();

  const cursor = loadCursor(skin.cursor);

  const beatmap = new BeatmapDifficulty(
    'beatmaps/Jesus-P - Death Should Not Have Taken Thee! (cheesiest) [Beginner].osu'
  );

  await beatmap.preload();
  await beatmap.load(skin);

  for (let i = beatmap.notes.length - 1; i >= 0; i--) {
    beatmap.notes[i].addToStage(game.notesStage);
  }
  game.play(beatmap);

  let numMouseDown = 0;

  function handleMouseDown() {
    numMouseDown++;
    const local = game.notesStage.toLocal(cursor.position, null, null, true);
    beatmap.mousedown(game.time, local);
  }

  function handleMouseUp() {
    numMouseDown--;
    if (numMouseDown === 0) {
      const local = game.notesStage.toLocal(cursor.position, null, null, true);
      beatmap.mouseup(game.time, local);
    }
  }

  window.addEventListener('mousedown', handleMouseDown);

  window.addEventListener('mousemove', e => {
    const { movementX, movementY } = e;
    cursor.x = clamp(cursor.x + movementX, 0, game.renderer.screen.width);
    cursor.y = clamp(cursor.y + movementY, 0, game.renderer.screen.height);

    const local = game.notesStage.toLocal(cursor.position, null, null, true);
    beatmap.mousemove(game.time, local);
  });

  window.addEventListener('mouseup', handleMouseUp);

  window.addEventListener(
    'keydown',
    e => {
      if (e.key === '1' || e.key === '2') {
        handleMouseDown();
      }
    },
    false
  );

  window.addEventListener(
    'keyup',
    e => {
      if (e.key === '1' || e.key === '2') {
        handleMouseUp();
      }
    },
    false
  );
}
