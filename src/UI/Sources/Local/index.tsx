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
  if (beatmaps.length === 0) {
    return null;
  }

  return (
    <Section>
      <h2>Local Beatmaps</h2>
      <div>
        {beatmaps.map(b => (
          <LocalBeatmapCard
            key={b.difficulties[0].beatmapID + '-' + b.difficulties[0].version}
            beatmap={b}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Section>
  );
}
