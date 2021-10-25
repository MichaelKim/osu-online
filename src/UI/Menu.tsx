import { useCallback, useEffect, useState } from 'react';
import { BeatmapFile } from '../Game';
import {
  BeatmapData,
  GameMode,
  parseBeatmap
} from '../Game/Loader/BeatmapLoader';
import BeatmapListing from './Components/BeatmapListing';
import { BeatmapFiles } from './Components/BeatmapUpload';
import { loadBeatmapDiff } from './Components/BeatmapUpload/loadBeatmaps';
import Header from './Components/Header';
import OptionsContext, { Options } from './options';
import { fetchOSZ } from './util';

const DEFAULT_MAPS = [
  '25828 44teru-k - F.I',
  '108470 xi - Parousia',
  '336099 LeaF - Wizdomiot [no video]',
  '1183900 Powerless feat. Sennzai - Lost Desire',
  '1281563 FELT - Vagueness & JOURNEY',
  '1245686 TUYU - Kako ni Torawarete Iru [no video]',
  '1329716 YOASOBI - Kaibutsu (TV Size) [no video]'
];

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

  useEffect(() => {
    // Load default maps on first load
    DEFAULT_MAPS.forEach(async url => {
      const { diffFiles, otherFiles } = await fetchOSZ(
        `assets/beatmaps/${url}.osz`
      );

      const texts = await Promise.all(diffFiles.map(f => f.text()));
      const diffs = texts
        .map(parseBeatmap)
        .filter(data => data.mode === GameMode.STANDARD)
        .map(data => loadBeatmapDiff(data, otherFiles));

      if (diffs.length > 0) {
        addBeatmaps([
          {
            info: {
              id: diffs[0].data.beatmapSetID,
              title: diffs[0].data.title,
              artist: diffs[0].data.artist,
              creator: diffs[0].data.creator,
              background: diffs[0].info.background
            },
            difficulties: diffs,
            files: otherFiles
          }
        ]);
      }
    });
  }, [addBeatmaps]);

  return (
    <OptionsContext.Provider value={options}>
      <Header onAdd={addBeatmaps} />
      <BeatmapListing beatmaps={beatmaps} onSelect={onSelect} />
    </OptionsContext.Provider>
  );
}
