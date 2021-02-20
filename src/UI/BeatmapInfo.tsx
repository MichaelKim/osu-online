import React from 'react';
import { BeatmapData, parseBeatmap } from '../Game/Loader/BeatmapLoader';

export type BeatmapFiles = {
  id: string;
  title: string;
  beatmapFiles: File[];
  otherFiles: File[];
};

type BeatmapInfoProps = {
  info: BeatmapFiles;
  onSelect: (
    id: string,
    title: string,
    data: BeatmapData,
    audioFile: File
  ) => void;
};

export default function BeatmapInfo({ info, onSelect }: BeatmapInfoProps) {
  const [diffs, setDiffs] = React.useState<BeatmapData[]>([]);

  React.useEffect(() => {
    Promise.all(
      info.beatmapFiles.map(f =>
        f.text().then(text => text.split('\n').map(l => l.trim()))
      )
    ).then(beatmaps => setDiffs(beatmaps.map(b => parseBeatmap(b))));
  }, [info.beatmapFiles]);

  const loadDiff = (data: BeatmapData) => {
    console.log('Load', data);
    const audioFile = info.otherFiles.find(f => f.name === data.audioFilename);
    if (audioFile == null) {
      console.error('Missing audio file!');
      return;
    }

    onSelect(info.id, info.title, data, audioFile);
  };

  return (
    <div>
      <p>ID: {info.id}</p>
      <p>Title: {info.title}</p>
      {diffs.map(d => (
        <p key={d.version} onClick={() => loadDiff(d)}>
          {d.version}
        </p>
      ))}
    </div>
  );
}
