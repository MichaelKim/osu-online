import initStart from './start';
import BeatmapDifficulty from './BeatmapDifficulty';
import Game from './Game';

initStart().then(init);

async function init() {
  const game = new Game(document.getElementsByTagName('canvas')[0]);
  await game.init();
  // game.loadTest();

  const beatmap = new BeatmapDifficulty(
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
