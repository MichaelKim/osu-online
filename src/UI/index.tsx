import { useCallback, useEffect, useRef, useState } from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import { SayobotBeatmapFiles } from './API/SayobotAPI';
import BeatmapListing from './Components/BeatmapListing';
import { BeatmapFiles } from './Components/BeatmapUpload';
import Header from './Components/Header';
import './index.scss';
import OptionsContext, { defaultOptions, Options } from './options';

export default function Root() {
  const game = useRef(new Game(document.getElementsByTagName('canvas')[0]));
  const [gameLoaded, setGameLoaded] = useState(false);
  const [beatmapLoaded, setBeatmapLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [options, setOptions] = useState({
    ...defaultOptions,
    setOptions: (o: Partial<Options>) => setOptions({ ...options, ...o })
  });

  const [localBeatmaps, setLocalBeatmaps] = useState<BeatmapFiles[]>([]);
  const [sayobotBeatmaps, setSayobotBeatmaps] = useState<SayobotBeatmapFiles[]>(
    []
  );

  useEffect(() => {
    game.current.options.set(options);
  }, [options]);

  useEffect(() => {
    game.current.init().then(() => setGameLoaded(true));
  }, []);

  const onSayobotAdd = useCallback(
    (beatmap: SayobotBeatmapFiles) => setSayobotBeatmaps(b => [...b, beatmap]),
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
      <OptionsContext.Provider value={options}>
        <Header onLoad={setLocalBeatmaps} onSayobotAdd={onSayobotAdd} />
      </OptionsContext.Provider>
      <BeatmapListing
        beatmaps={localBeatmaps}
        sayobot={sayobotBeatmaps}
        onSelect={onSelect}
      />

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
