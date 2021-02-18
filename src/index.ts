import 'pixi-sound';
import Game from './Game';
import { parseBeatmap } from './Game/Loader/BeatmapLoader';
import initStart from './Game/start';

initStart().then(init);

async function init() {
  const game = new Game(document.getElementsByTagName('canvas')[0]);
  await game.init();

  const beatmapData = await parseBeatmap(
    'beatmaps/LeaF - Wizdomiot (Asahina Momoko) [Hard].osu'
    // "beatmaps/Hatsune Miku - Rubik's Cube (rui) [5x5x5].osu"
    // 'beatmaps/Jesus-P - Death Should Not Have Taken Thee! (cheesiest) [Beginner].osu'
  );

  await game.loadBeatmap(beatmapData);
  game.play();
}
