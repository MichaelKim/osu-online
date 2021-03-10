import { useCallback } from 'react';
import BeatmapBar from '../../Components/BeatmapBar';
import { BeatmapFiles } from '../../Components/BeatmapUpload';
import { useBackgroundImage } from './localUtil';

type Props = {
  beatmap: BeatmapFiles;
  expanded: boolean;
  onClick: (beatmap: BeatmapFiles) => void;
  onClickDiff: (version: string) => void;
};

export default function LocalBeatmapBar({
  beatmap,
  expanded,
  onClick,
  onClickDiff
}: Props) {
  const bg = useBackgroundImage(beatmap);

  const _onClick = useCallback(() => onClick(beatmap), [beatmap, onClick]);

  return (
    <BeatmapBar
      beatmap={{
        title: beatmap.difficulties[0].title,
        artist: beatmap.difficulties[0].artist,
        creator: beatmap.difficulties[0].creator,
        diffs: beatmap.difficulties.map(d => ({
          key: d.beatmapID + '-' + d.version,
          version: d.version,
          stars: 0
        })),
        bg
      }}
      expanded={expanded}
      onClick={_onClick}
      onClickDiff={onClickDiff}
    />
  );
}
