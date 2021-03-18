import { useCallback, useState } from 'preact/hooks';
import { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './Components/BeatmapListing';
import { BeatmapFiles } from './Components/BeatmapUpload';
import Header from './Components/Header';
import OptionsContext, { Options } from './options';

type Props = {
  options: Options & {
    setOptions: (o: Partial<Options>) => void;
  };
  onSelect: (data: BeatmapData, files: BeatmapFile[]) => void;
};

export default function Menu({ options, onSelect }: Props) {
  const [beatmaps, setBeatmaps] = useState<BeatmapFiles[]>([]);

  const addBeatmaps = useCallback(
    (beatmap: BeatmapFiles[]) => setBeatmaps(b => [...b, ...beatmap]),
    []
  );

  return (
    <OptionsContext.Provider value={options}>
      <Header onAdd={addBeatmaps} />
      <BeatmapListing beatmaps={beatmaps} onSelect={onSelect} />
    </OptionsContext.Provider>
  );
}
