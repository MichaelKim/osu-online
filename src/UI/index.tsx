import { useCallback, useEffect, useRef, useState } from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import { SayobotBeatmapFiles } from './API/SayobotAPI';
import BeatmapListing from './Components/BeatmapListing';
import { BeatmapFiles } from './Components/BeatmapUpload';
import Header from './Components/Header';
import './index.scss';
import OptionsContext, { CursorType, defaultOptions, Options } from './options';

type Props = {
  supportsRawInput: boolean;
};

export default function Root({ supportsRawInput }: Props) {
  const game = useRef(new Game(document.getElementsByTagName('canvas')[0]));
  const [gameLoaded, setGameLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [options, setOptions] = useState({
    ...defaultOptions,
    rawInput:
      !supportsRawInput && defaultOptions.cursorType === CursorType.UNADJUSTED
        ? CursorType.LOCKED
        : defaultOptions.cursorType,
    supportsRawInput,
    setOptions: (o: Partial<Options>) =>
      setOptions(options => ({ ...options, ...o }))
  });

  const [localBeatmaps, setLocalBeatmaps] = useState<BeatmapFiles[]>([]);
  const [sayobotBeatmaps, setSayobotBeatmaps] = useState<SayobotBeatmapFiles[]>(
    []
  );

  // Update game options
  useEffect(() => {
    game.current.options.set(options);
  }, [options]);

  const onSayobotAdd = useCallback(
    (beatmap: SayobotBeatmapFiles) => setSayobotBeatmaps(b => [...b, beatmap]),
    []
  );

  const onSelect = useCallback(
    async (data: BeatmapData, files: BeatmapFile[]) => {
      // Load game
      if (!gameLoaded) {
        await game.current.init();
        setGameLoaded(true);
      }

      // Load beatmap
      if (await game.current.loadBeatmap(data, files)) {
        setPlaying(true);
        game.current.play();
      }
    },
    [gameLoaded]
  );

  return (
    <div
      className='root'
      style={{
        display: playing ? 'none' : 'flex'
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
    </div>
  );
}
