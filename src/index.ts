import Game from './Game';
import initStart from './start';

initStart().then(init);

async function init() {
  const game = new Game(document.getElementsByTagName('canvas')[0]);
  await game.init();
  // game.loadTest();

  await game.loadBeatmap(
    'beatmaps/LeaF - Wizdomiot (Asahina Momoko) [Hard].osu'
    // 'beatmaps/Jesus-P - Death Should Not Have Taken Thee! (cheesiest) [Beginner].osu'
  );
  game.play();
}
