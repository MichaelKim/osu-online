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
    DEFAULT_BEATMAPS.forEach(async url => {
      const { diffFiles, otherFiles } = await fetchOSZ(`beatmaps/${url}`);

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
