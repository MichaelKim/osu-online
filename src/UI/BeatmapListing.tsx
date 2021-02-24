import React from 'react';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import BeatmapCard from './BeatmapCard';
import { BeatmapFiles } from './BeatmapUpload';

type Props = {
  beatmaps: BeatmapFiles[];
  onSelect: (id: string, data: BeatmapData, audioFile: File) => void;
};

export default function BeatmapListing({ beatmaps, onSelect }: Props) {
  return (
    <div>
      {beatmaps.map(b => (
        <BeatmapCard key={b.id} beatmap={b} onSelect={onSelect} />
      ))}
    </div>
  );
}
