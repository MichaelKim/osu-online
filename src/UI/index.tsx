import { useCallback, useEffect, useRef, useState } from 'react';
import Game, { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import Menu from './Menu';
import { CursorType, defaultOptions, Options } from './options';
import style from './index.module.scss';

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

  return (
    <div className={playing ? style.playingRoot : style.root}>
      <Menu options={options} onSelect={onSelect} />
    </div>
  );
}
