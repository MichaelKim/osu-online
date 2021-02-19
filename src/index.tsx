import 'pixi-sound';
import React from 'react';
import ReactDOM from 'react-dom';
import Game from './Game';
import { parseBeatmap } from './Game/Loader/BeatmapLoader';
import initStart from './Game/start';
import { readFile } from './Game/util';
import Root from './UI';

// initStart().then(init);

async function init() {
  const game = new Game(document.getElementsByTagName('canvas')[0]);
  await game.init();

  const file = await readFile(
    'beatmaps/LeaF - Wizdomiot (Asahina Momoko) [Hard].osu'
    // "beatmaps/Hatsune Miku - Rubik's Cube (rui) [5x5x5].osu"
    // 'beatmaps/Jesus-P - Death Should Not Have Taken Thee! (cheesiest) [Beginner].osu'
  );
  const beatmapData = parseBeatmap(file);

  await game.loadBeatmap(beatmapData);
  game.play();
}

ReactDOM.render(<Root />, document.getElementById('app'));
