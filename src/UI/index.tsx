import { useCallback, useEffect, useRef, useState } from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import Menu from './Menu';
import { CursorType, defaultOptions, Options } from './options';
import style from './index.module.scss';

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
    game.current.options.set(options);
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

  const onPause = () => {
    setPaused(true);
    game.current.pause();
  };

  useEffect(() => {
    document.addEventListener('pointerlockchange', () => {
      const locked = document.pointerLockElement !== null;
      console.log('Pointer lock:', locked);
      if (!locked) {
        onPause();
      }
    });

    document.addEventListener('visibilitychange', () => {
      const visible = document.visibilityState === 'visible';
      console.log('Visible:', visible);
      if (!visible) {
        onPause();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const full = document.fullscreenElement != null;
      console.log('Fullscreen:', full);
      if (!full) {
        onPause();
      }
    });
  }, []);

  return (
    <>
      <div className={playing ? style.playingRoot : style.root}>
        <Menu options={options} onSelect={onSelect} />
      </div>
      <div className={paused ? style.lock : style.noLock} onClick={onResume}>
        <div className={style.lockMessage}>
          <p>Out of focus!</p>
          <p>Click to return</p>
        </div>
      </div>
    </>
  );
}
