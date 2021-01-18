import 'pixi-sound';
import Game from './Game';
import { parseBeatmap } from './Loader/BeatmapLoader';
import initStart from './start';

initStart().then(init);

async function init() {
  const game = new Game(document.getElementsByTagName('canvas')[0]);
  await game.init();
  // game.loadTest();

  const beatmapData = await parseBeatmap(
    'beatmaps/LeaF - Wizdomiot (Asahina Momoko) [Hard].osu'
    // 'beatmaps/Jesus-P - Death Should Not Have Taken Thee! (cheesiest) [Beginner].osu'
  );

  await game.loadBeatmap(beatmapData);
  game.play();
}
