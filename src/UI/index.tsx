import { useCallback, useEffect, useRef, useState } from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './Components/BeatmapListing';
import { LocalBeatmapFiles } from './Components/BeatmapUpload';
import Header from './Components/Header';
import './index.scss';

export default function Root() {
  const game = useRef(new Game(document.getElementsByTagName('canvas')[0]));
  const [gameLoaded, setGameLoaded] = useState(false);
  const [beatmapLoaded, setBeatmapLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);

  const [localBeatmaps, setLocalBeatmaps] = useState<LocalBeatmapFiles[]>([]);

  useEffect(() => {
    game.current.init().then(() => setGameLoaded(true));
  }, []);

  const onLoad = useCallback(
    (beatmaps: LocalBeatmapFiles[]) => setLocalBeatmaps(beatmaps),
    []
  );

  const onSelect = useCallback(
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
        display: playing ? 'none' : 'flex',
        height: '100%',
        flexDirection: 'column'
      }}
    >
      <Header onLoad={onLoad} />
      <BeatmapListing beatmaps={localBeatmaps} onSelect={onSelect} />

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
