import React from 'react';
import { SayobotBeatmapInfo } from '../../API/SayobotAPI';
import BeatmapCard from '../../Components/BeatmapCard';

type Props = {
  b: SayobotBeatmapInfo;
  onSelect: (beatmap: SayobotBeatmapInfo, diffID: number) => void;
};

export default function SayobotBeatmapCard({ b, onSelect }: Props) {
  const _onSelect = React.useCallback((diffID: number) => onSelect(b, diffID), [
    b,
    onSelect
  ]);

  return (
    <BeatmapCard
      beatmap={{
        id: b.sid,
        title: b.title,
        artist: b.artist,
        creator: b.creator,
        diffs: b.bid_data.map(d => ({
          id: d.bid,
          version: d.version,
          stars: d.star
        })),
        bg: `https://cdn.sayobot.cn:25225/beatmaps/${b.sid}/covers/cover.webp`
      }}
      onSelect={_onSelect}
    />
  );
}
