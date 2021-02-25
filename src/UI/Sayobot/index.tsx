import React from 'react';
import {
  getBeatmapInfo,
  getBeatmapList,
  SayobotBeatmapInfo
} from '../API/SayobotAPI';
import BeatmapCard from '../BeatmapCard';
import JSZip from 'jszip';
import { BeatmapData, parseBeatmap } from '../../Game/Loader/BeatmapLoader';

type Props = {
  onSelect: (diff: BeatmapData, audioFile: Blob) => void;
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

function SayobotHot({ onSelect }: Props) {
  const [beatmaps, setBeatmaps] = React.useState<SayobotBeatmapInfo[]>([]);

  React.useEffect(() => {
    getBeatmapList({ limit: 4, mode: 1 })
      .then(list => Promise.all(list.data.map(d => getBeatmapInfo(d.sid))))
      .then(data => {
        setBeatmaps(data.map(d => d.data));
      });
  }, []);

  const _onSelect = React.useCallback(
    async (beatmap: SayobotBeatmapInfo, diffID: number) => {
      const url =
        'https://txy1.sayobot.cn/beatmaps/download/mini/' + beatmap.sid;
      const { diffs, otherFiles } = await fetchOsz(url);

      // Find selected diff
      const diff = diffs.find(d => d.beatmapID === diffID);
      if (diff == null) {
        console.error('Missing difficulty');
        return;
      }

      // Get audio
      const audioFile = otherFiles.find(
        f => f.file.name === diff.audioFilename
      );
      if (audioFile == null) {
        console.error('Missing audio file!');
        return;
      }

      onSelect(diff, audioFile.blob);
    },
    [onSelect]
  );

  if (beatmaps.length === 0) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {beatmaps.map(b => (
        <BeatmapCard
          key={b.sid}
          beatmap={{
            id: b.sid,
            title: b.title,
            artist: b.artist,
            creator: b.creator,
            diffs: b.bid_data.map(d => ({
              id: d.bid,
              version: d.version,
              stars: d.star
            }))
          }}
          onSelect={diffID => _onSelect(b, diffID)}
        />
      ))}
    </div>
  );
}

export function Sayobot({ onSelect }: Props) {
  return (
    <div>
      <SayobotHot onSelect={onSelect} />
    </div>
  );
}
