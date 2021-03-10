import { useCallback } from 'react';
import { SayobotBeatmapFiles } from '../../API/SayobotAPI';
import BeatmapBar from '../../Components/BeatmapBar';
import { BeatmapFiles } from '../../Components/BeatmapUpload';

type Props = {
  beatmap: SayobotBeatmapFiles;
  expanded: boolean;
  onClick: (beatmap: BeatmapFiles) => void;
  onClickDiff: (version: string) => void;
};

export default function SayobotBeatmapBar({
  beatmap: { info, beatmap },
  expanded,
  onClick,
  onClickDiff
}: Props) {
  const _onClick = useCallback(() => onClick(beatmap), [beatmap, onClick]);

  return (
    <BeatmapBar
      beatmap={{
        title: info.title,
        artist: info.artist,
        creator: info.creator,
        diffs: info.bid_data.map(d => ({
          key: d.bid.toString(),
          version: d.version,
          stars: d.star
        })),
        bg: `https://cdn.sayobot.cn:25225/beatmaps/${info.sid}/covers/cover.webp`
      }}
      expanded={expanded}
      onClick={_onClick}
      onClickDiff={onClickDiff}
    />
  );
}
