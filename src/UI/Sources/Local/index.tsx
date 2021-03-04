import React from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import BeatmapUpload, { LocalBeatmapFiles } from './BeatmapUpload';
import style from './BeatmapUpload.module.scss';
import LocalBeatmapCard from './LocalBeatmapCard';

type Props = {
  onSelect: (diff: BeatmapData, files: BeatmapFile[]) => void;
};

export default function Local({ onSelect }: Props) {
  const [beatmaps, setBeatmaps] = React.useState<LocalBeatmapFiles[]>([]);

  const onLoad = React.useCallback(
    (beatmaps: LocalBeatmapFiles[]) => setBeatmaps(beatmaps),
    []
  );

  const _onSelect = React.useCallback(
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

  return (
    <>
      <div className={style.localHeader}>
        <h2>Local Beatmaps</h2>
        <BeatmapUpload onSelect={onLoad} />
      </div>
      <div>
        {beatmaps.map(b => (
          <LocalBeatmapCard key={b.id} b={b} onSelect={_onSelect} />
        ))}
      </div>
    </>
  );
}
