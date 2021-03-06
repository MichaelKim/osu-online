import React from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './Components/BeatmapListing';
import Header from './Components/Header';
import { LocalBeatmapFiles } from './Components/Header/BeatmapUpload';
import Local from './Sources/Local';
import './index.scss';

export default function Root() {
  const game = React.useRef(
    new Game(document.getElementsByTagName('canvas')[0])
  );
  const [gameLoaded, setGameLoaded] = React.useState(false);
  const [beatmapLoaded, setBeatmapLoaded] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);

  const [localBeatmaps, setLocalBeatmaps] = React.useState<LocalBeatmapFiles[]>(
    []
  );

  React.useEffect(() => {
    game.current.init().then(() => setGameLoaded(true));
  }, []);

  const onLoad = React.useCallback(
    (beatmaps: LocalBeatmapFiles[]) => setLocalBeatmaps(beatmaps),
    []
  );

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
      <Header onLoad={onLoad} />
      <Local beatmaps={localBeatmaps} onSelect={onSelect} />
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
