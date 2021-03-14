import { useCallback, useEffect, useState } from 'react';
import {
  getBeatmapInfo,
  getBeatmapList,
  SayobotBeatmapFiles,
  SayobotBeatmapInfo,
  SayobotListClass,
  SayobotListMode,
  SayobotListType
} from '../../API/SayobotAPI';
import LoadingCircle from '../../Components/LoadingCircle';
import { useDebounce } from '../../util';
import { fetchOsz } from './loadSayobotBeatmaps';
import SayobotBeatmapCard from './SayobotBeatmapCard';

type Props = {
  search: string;
  onSelect: (beatmap: SayobotBeatmapFiles) => void;
};

export default function Sayobot({ search, onSelect }: Props) {
  const [loading, setLoading] = useState(true);
  const [beatmaps, setBeatmaps] = useState<SayobotBeatmapInfo[]>([]);

  const debounce = useDebounce(500);

  useEffect(() => {
    setLoading(true);

    const onSearch = async () => {
      const list = await getBeatmapList({
        limit: 4,
        type: search === '' ? SayobotListType.NEW : SayobotListType.SEARCH,
        keyword: search,
        mode: SayobotListMode.STD,
        class: SayobotListClass.RANKED
      });
      const data = await Promise.all(list.data.map(d => getBeatmapInfo(d.sid)));

      setLoading(false);
      setBeatmaps(data.map(d => d.data));
    };

    return debounce(onSearch);
  }, [debounce, search]);

  const _onSelect = useCallback(
    async (info: SayobotBeatmapInfo) => {
      const beatmap = await fetchOsz(info);
      onSelect({ info, beatmap });
    },
    [onSelect]
  );

  if (loading) {
    return <LoadingCircle />;
  }

  return (
    <div>
      {beatmaps.map(b => (
        <SayobotBeatmapCard key={b.sid} b={b} onSelect={_onSelect} />
      ))}
    </div>
  );
}
