import React from 'react';
import BeatmapCard from '../../Components/BeatmapCard';
import { LocalBeatmapFiles } from '../../Components/BeatmapUpload';

type Props = {
  b: LocalBeatmapFiles;
  onSelect: (beatmap: LocalBeatmapFiles, diffID: number) => void;
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

  const _onSelect = React.useCallback((diffID: number) => onSelect(b, diffID), [
    b,
    onSelect
  ]);

  return (
    <BeatmapCard
      onSelect={_onSelect}
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
