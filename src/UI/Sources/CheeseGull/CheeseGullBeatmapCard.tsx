import { useCallback } from 'react';
import { CheeseGullSet } from '../../API/CheeseGullAPI';
import BeatmapCard from '../../Components/BeatmapCard';

type Props = {
  b: CheeseGullSet;
  onSelect: (beatmap: CheeseGullSet) => Promise<void>;
};

export default function CheeseGullBeatmapCard({ b, onSelect }: Props) {
  const _onSelect = useCallback(() => onSelect(b), [b, onSelect]);

  return (
    <BeatmapCard
      beatmap={{
        id: b.SetID,
        title: b.Title,
        artist: b.Artist,
        creator: b.Creator,
        diffs: b.ChildrenBeatmaps.map(d => ({
          id: d.BeatmapID,
          version: d.DiffName,
          stars: d.DifficultyRating
        })),
        bg: `https://assets.ppy.sh/beatmaps/${b.SetID}/covers/cover.jpg`
      }}
      onSelect={_onSelect}
    />
  );
}
