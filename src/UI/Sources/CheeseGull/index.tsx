import { useCallback, useEffect, useState } from 'react';
import {
  CheeseGullBeatmapMode,
  CheeseGullBeatmapStatus,
  CheeseGullSet,
  getBeatmapList
} from '../../API/CheeseGullAPI';
import { BeatmapFiles } from '../../Components/BeatmapUpload';
import LoadingCircle from '../../Components/LoadingCircle';
import { useDebounce } from '../../util';
import CheeseGullBeatmapCard from './CheeseGullBeatmapCard';
import { fetchRipple } from './loadRippleBeatmaps';

export type CheeseGullBeatmapFiles = {
  info: CheeseGullSet;
  beatmap: BeatmapFiles;
};

type Props = {
  search: string;
  onSelect: (beatmaps: BeatmapFiles[]) => void;
};

export default function CheeseGull({ search, onSelect }: Props) {
  const [loading, setLoading] = useState(true);
  const [beatmaps, setBeatmaps] = useState<CheeseGullSet[]>([]);

  const debounce = useDebounce(500);

  useEffect(() => {
    setLoading(true);

    const onSearch = async () => {
      const set = await getBeatmapList({
        amount: 4,
        status: [CheeseGullBeatmapStatus.RANKED],
        mode: [CheeseGullBeatmapMode.STD],
        query: search
      });

      setLoading(false);
      setBeatmaps(set);
    };

    return debounce(onSearch);
  }, [debounce, search]);

  const _onSelect = useCallback(
    async (info: CheeseGullSet) => {
      const beatmap = await fetchRipple(info);
      onSelect([beatmap]);
    },
    [onSelect]
  );

  if (loading) {
    return <LoadingCircle />;
  }

  return (
    <div>
      {beatmaps.map(b => (
        <CheeseGullBeatmapCard key={b.SetID} b={b} onSelect={_onSelect} />
      ))}
    </div>
  );
}
