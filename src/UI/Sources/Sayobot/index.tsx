import JSZip from 'jszip';
import { useRef, useState, useEffect, useCallback } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData, parseBeatmap } from '../../../Game/Loader/BeatmapLoader';
import {
  getBeatmapInfo,
  getBeatmapList,
  SayobotBeatmapInfo,
  SayobotListMode,
  SayobotListType
} from '../../API/SayobotAPI';
import LoadingCircle from '../../Components/LoadingCircle';
import SayobotBeatmapCard from './SayobotBeatmapCard';

type Props = {
  search: string;
  onSelect: (diff: BeatmapData, files: BeatmapFile[]) => void;
};

async function fetchOsz(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const zip = await JSZip.loadAsync(blob);

  const files = await Promise.all(
    Object.values(zip.files).map(async f => ({
      file: f,
      blob: await f.async('blob')
    }))
  );

  // Find all .osu files
  const diffFiles = files.filter(f => f.file.name.endsWith('.osu'));
  const otherFiles = files.filter(f => !f.file.name.endsWith('.osu'));

  // Parse diffs
  const diffs = await Promise.all(
    diffFiles.map(async d => {
      const text = await d.blob.text();
      return parseBeatmap(text.split('\n').map(l => l.trim()));
    })
  );

  return {
    diffs,
    otherFiles
  };
}

export default function Sayobot({ search, onSelect }: Props) {
  const timeoutID = useRef<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [beatmaps, setBeatmaps] = useState<SayobotBeatmapInfo[]>([]);

  useEffect(() => {
    return;
    setLoading(true);

    // Debounce
    clearTimeout(timeoutID.current);
    timeoutID.current = window.setTimeout(async () => {
      const list = await getBeatmapList({
        limit: 4,
        type: search === '' ? SayobotListType.NEW : SayobotListType.SEARCH,
        keyword: search,
        mode: SayobotListMode.STD
      });
      const data = await Promise.all(list.data.map(d => getBeatmapInfo(d.sid)));

      setLoading(false);
      setBeatmaps(data.map(d => d.data));
    }, 500);
  }, [search]);

  const _onSelect = useCallback(
    async (beatmap: SayobotBeatmapInfo, version: string) => {
      const url =
        'https://txy1.sayobot.cn/beatmaps/download/mini/' + beatmap.sid;
      const { diffs, otherFiles } = await fetchOsz(url);

      // Find selected diff
      const diff = diffs.find(d => d.version === version);
      if (diff == null) {
        console.error('Missing difficulty');
        return;
      }

      const files = otherFiles.map(f => ({
        name: f.file.name,
        blob: f.blob
      }));

      onSelect(diff, files);
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
