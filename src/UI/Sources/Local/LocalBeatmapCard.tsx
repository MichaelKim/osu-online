import React from 'react';
import BeatmapCard from '../../Components/BeatmapCard';
import { BeatmapFiles } from './BeatmapUpload';

type Props = {
  b: BeatmapFiles;
  onSelect: (beatmap: BeatmapFiles, diffID: number) => void;
};

export default function LocalBeatmapCard({ b, onSelect }: Props) {
  const [bg, setBg] = React.useState('');

  // Load background image
  const bgFilename = b.difficulties[0].background.filename;
  const bgFile = b.files.find(f => f.name === bgFilename);
  React.useEffect(() => {
    if (bgFile != null) {
      const objectURL = URL.createObjectURL(bgFile);
      setBg(objectURL);
      return () => {
        URL.revokeObjectURL(objectURL);
      };
    }
  }, [bgFile]);

  return (
    <BeatmapCard
      onSelect={diffID => onSelect(b, diffID)}
      beatmap={{
        id: b.id,
        title: b.difficulties[0].title,
        artist: b.difficulties[0].artist,
        creator: b.difficulties[0].creator,
        diffs: b.difficulties.map(d => ({
          id: d.beatmapID,
          version: d.version,
          stars: 0
        })),
        bg
      }}
    />
  );
}
