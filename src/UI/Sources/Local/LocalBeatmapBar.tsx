import { useCallback } from 'react';
import BeatmapBar from '../../Components/BeatmapBar';
import { BeatmapFiles } from '../../Components/BeatmapUpload';

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
  const _onClick = useCallback(() => onClick(beatmap), [beatmap, onClick]);

  const diff = beatmap.difficulties[0];

  return (
    <BeatmapBar
      beatmap={{
        title: diff.data.title,
        artist: diff.data.artist,
        creator: diff.data.creator,
        diffs: beatmap.difficulties.map(d => ({
          key: d.data.beatmapID + '-' + d.data.version,
          version: d.data.version,
          stars: 0
        })),
        bg: diff.info.background
      }}
      expanded={expanded}
      onClick={_onClick}
      onClickDiff={onClickDiff}
    />
  );
}
