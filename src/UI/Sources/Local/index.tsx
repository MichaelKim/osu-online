import { useCallback } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import { LocalBeatmapFiles } from '../../Components/BeatmapUpload';
import Section from '../../Components/Section';
import LocalBeatmapCard from './LocalBeatmapCard';

type Props = {
  beatmaps: LocalBeatmapFiles[];
  onSelect: (diff: BeatmapData, files: BeatmapFile[]) => void;
};

export default function Local({ beatmaps, onSelect }: Props) {
  const _onSelect = useCallback(
    (beatmap: LocalBeatmapFiles, diffID: number) => {
      const diff = beatmap.difficulties.find(d => d.beatmapID === diffID);
      if (diff == null) {
        console.error('Missing difficulty');
        return;
      }

      const files = beatmap.files.map(f => ({
        name: f.name,
        blob: f
      }));

      onSelect(diff, files);
    },
    [onSelect]
  );

  if (beatmaps.length === 0) {
    return null;
  }

  return (
    <Section>
      <h2>Local Beatmaps</h2>
      <div>
        {beatmaps.map(b => (
          <LocalBeatmapCard key={b.id} b={b} onSelect={_onSelect} />
        ))}
      </div>
    </Section>
  );
}
