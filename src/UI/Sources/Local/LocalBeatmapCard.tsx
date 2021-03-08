import { useState, useEffect, useCallback } from 'react';
import BeatmapCard from '../../Components/BeatmapCard';
import { LocalBeatmapFiles } from '../../Components/BeatmapUpload';

type Props = {
  beatmap: LocalBeatmapFiles;
  onSelect: (beatmap: LocalBeatmapFiles, diffID: number) => void;
};

export default function LocalBeatmapCard({ beatmap, onSelect }: Props) {
  const [bg, setBg] = useState('');

  // Load background image
  const bgFilename = beatmap.difficulties[0].background.filename;
  const bgFile = beatmap.files.find(f => f.name === bgFilename);
  useEffect(() => {
    if (bgFile != null) {
      const objectURL = URL.createObjectURL(bgFile.blob);
      setBg(objectURL);
      return () => {
        URL.revokeObjectURL(objectURL);
      };
    }
  }, [bgFile]);

  const _onSelect = useCallback((diffID: number) => onSelect(beatmap, diffID), [
    beatmap,
    onSelect
  ]);

  return (
    <BeatmapCard
      onSelect={_onSelect}
      beatmap={{
        title: beatmap.difficulties[0].title,
        artist: beatmap.difficulties[0].artist,
        creator: beatmap.difficulties[0].creator,
        diffs: beatmap.difficulties.map(d => ({
          id: d.beatmapID,
          version: d.version,
          stars: 0
        })),
        bg
      }}
    />
  );
}
