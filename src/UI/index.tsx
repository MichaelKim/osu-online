import React from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './Components/BeatmapListing';
import './index.scss';

export default function Root() {
  const game = React.useRef(
    new Game(document.getElementsByTagName('canvas')[0])
  );
  const [gameLoaded, setGameLoaded] = React.useState(false);
  const [beatmapLoaded, setBeatmapLoaded] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    game.current.init().then(() => setGameLoaded(true));
  }, []);

  const onSelect = React.useCallback(
    async (data: BeatmapData, files: BeatmapFile[]) => {
      // Load beatmap
      setBeatmapLoaded(false);
      if (await game.current.loadBeatmap(data, files)) {
        setBeatmapLoaded(true);
      }
    },
    []
  );

  return (
    <div
      style={{
        display: playing ? 'none' : 'block'
      }}
    >
      <h1>osu!</h1>

      <BeatmapListing onSelect={onSelect} />

      {gameLoaded ? (
        <>
          <p>Game loaded</p>
          {beatmapLoaded ? (
            <>
              <p>Beatmap loaded</p>
              <button
                onClick={() => {
                  setPlaying(true);
                  game.current.play();
                }}
              >
                Start!
              </button>
            </>
          ) : (
            <p>Beatmap loading</p>
          )}
        </>
      ) : (
        <p>Game loading</p>
      )}
    </div>
  );
}
