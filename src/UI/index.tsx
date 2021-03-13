import { useCallback, useEffect, useRef, useState } from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import Menu from './Menu';
import { CursorType, defaultOptions, Options } from './options';
import style from './index.module.scss';
import { onPause } from '../Game/lock';

type Props = {
  supportsRawInput: boolean;
};

const g = new Game(document.getElementsByTagName('canvas')[0]);

export default function Root({ supportsRawInput }: Props) {
  const game = useRef(g);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
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

  // Update game options
  useEffect(() => {
    game.current.setOptions(options);
  }, [options]);

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

  // Playback control
  const onResume = () => {
    setPaused(false);
    game.current.resume();
  };

  useEffect(() => {
    onPause(() => {
      if (game.current.isPlaying()) {
        setPaused(true);
        game.current.pause();
      }
    });
  }, []);

  return (
    <>
      <div className={playing ? style.playingRoot : style.root}>
        <Menu options={options} onSelect={onSelect} />
      </div>
      {paused && (
        <div className={style.lock} onClick={onResume}>
          <div className={style.lockMessage}>
            <p>Out of focus!</p>
            <p>Click to return</p>
          </div>
        </div>
      )}
    </>
  );
}
