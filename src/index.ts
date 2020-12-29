import Beatmap from './Beatmap';
import Game from './Game';
import initStart from './start';

initStart().then(init);

async function init() {
  const game = new Game(document.getElementsByTagName('canvas')[0]);
  await game.init();
  // game.loadTest();

  const beatmap = new Beatmap(
    'beatmaps/LeaF - Wizdomiot (Asahina Momoko) [Hard].osu'
    // 'beatmaps/Jesus-P - Death Should Not Have Taken Thee! (cheesiest) [Beginner].osu'
  );

  await beatmap.preload();
  await beatmap.load(game.skin);

  for (let i = beatmap.notes.length - 1; i >= 0; i--) {
    beatmap.notes[i].addToStage(game.renderer.notesStage);
  }
  game.play(beatmap);
}
