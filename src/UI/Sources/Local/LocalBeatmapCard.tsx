import { useCallback } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import BeatmapCard from '../../Components/BeatmapCard';
import { LocalBeatmapFiles } from '../../Components/BeatmapUpload';
import { useBackgroundImage } from './localUtil';

type Props = {
  beatmap: LocalBeatmapFiles;
  onSelect: (diff: BeatmapData, files: BeatmapFile[]) => void;
};

export default function LocalBeatmapCard({ beatmap, onSelect }: Props) {
  const bg = useBackgroundImage(beatmap);

  const _onSelect = useCallback(
    (version: string) => {
      const diff = beatmap.difficulties.find(d => d.version === version);
      if (diff == null) {
        console.error('Missing difficulty');
        return;
      }

      onSelect(diff, beatmap.files);
    },
    [beatmap, onSelect]
  );

  return (
    <BeatmapCard
      onSelect={_onSelect}
      beatmap={{
        title: beatmap.difficulties[0].title,
        artist: beatmap.difficulties[0].artist,
        creator: beatmap.difficulties[0].creator,
        diffs: beatmap.difficulties.map(d => ({
          id: d.beatmapID,
          version: d.version,
          stars: 0
        })),
        bg
      }}
    />
  );
}
