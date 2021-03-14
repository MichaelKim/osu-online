import { useCallback } from 'react';
import {
  CheeseGullBeatmapMode,
  CheeseGullBeatmapStatus,
  CheeseGullSet,
  getBeatmapList
} from '../../API/CheeseGullAPI';
import { BeatmapFiles } from '../../Components/BeatmapUpload';
import BeatmapSearch from '../BeatmapSearch';
import CheeseGullBeatmapCard from './CheeseGullBeatmapCard';
import { fetchRipple } from './loadRippleBeatmaps';

type Props = {
  search: string;
  onSelect: (beatmaps: BeatmapFiles[]) => void;
};

const LIMIT = 8;

export default function CheeseGull({ search, onSelect }: Props) {
  const onSearch = useCallback(
    (keyword: string, offset: number) =>
      getBeatmapList({
        amount: LIMIT,
        offset,
        status: [CheeseGullBeatmapStatus.RANKED],
        mode: [CheeseGullBeatmapMode.STD],
        query: keyword
      }),
    []
  );

  const _onSelect = useCallback(
    async (info: CheeseGullSet) => {
      const beatmap = await fetchRipple(info);
      onSelect([beatmap]);
    },
    [onSelect]
  );

  return (
    <BeatmapSearch search={search} limit={LIMIT} onSearch={onSearch}>
      {b => <CheeseGullBeatmapCard key={b.SetID} b={b} onSelect={_onSelect} />}
    </BeatmapSearch>
  );
}
