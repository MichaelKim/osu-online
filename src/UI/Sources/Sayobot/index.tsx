import { useCallback } from 'react';
import {
  getSayobotBeatmaps,
  SayobotBeatmapInfo,
  SayobotListClass,
  SayobotListMode,
  SayobotListType
} from '../../API/SayobotAPI';
import { BeatmapFiles } from '../../Components/BeatmapUpload';
import BeatmapSearch from '../BeatmapSearch';
import { fetchSayobot } from './loadSayobotBeatmaps';
import SayobotBeatmapCard from './SayobotBeatmapCard';

type Props = {
  search: string;
  onSelect: (beatmaps: BeatmapFiles[]) => void;
};

const LIMIT = 8;

export default function Sayobot({ search, onSelect }: Props) {
  const onSearch = useCallback(
    (keyword: string, offset: number) =>
      getSayobotBeatmaps({
        limit: LIMIT,
        offset,
        type: keyword === '' ? SayobotListType.HOT : SayobotListType.SEARCH,
        keyword,
        mode: SayobotListMode.STD,
        class: SayobotListClass.RANKED
      }),
    []
  );

  const _onSelect = useCallback(
    async (info: SayobotBeatmapInfo) => {
      const beatmap = await fetchSayobot(info);
      onSelect([beatmap]);
    },
    [onSelect]
  );

  return (
    <BeatmapSearch search={search} limit={LIMIT} onSearch={onSearch}>
      {b => <SayobotBeatmapCard key={b.sid} b={b} onSelect={_onSelect} />}
    </BeatmapSearch>
  );
}
