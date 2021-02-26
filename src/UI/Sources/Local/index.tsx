import React from 'react';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import BeatmapCard from '../../Components/BeatmapCard';
import BeatmapUpload, { BeatmapFiles } from './BeatmapUpload';
import style from './BeatmapUpload.module.scss';

type Props = {
  onSelect: (diff: BeatmapData, audioFile: Blob) => void;
};

export default function Local({ onSelect }: Props) {
  const [beatmaps, setBeatmaps] = React.useState<BeatmapFiles[]>([]);

  const onLoad = React.useCallback(
    (beatmaps: BeatmapFiles[]) => setBeatmaps(beatmaps),
    []
  );

  const _onSelect = React.useCallback(
    (beatmap: BeatmapFiles, diffID: number) => {
      const diff = beatmap.difficulties.find(d => d.beatmapID === diffID);
      if (diff == null) {
        console.error('Missing difficulty');
        return;
      }

      const audioFile = beatmap.files.find(f => f.name === diff.audioFilename);
      if (audioFile == null) {
        console.error('Missing audio file!');
        return;
      }

      onSelect(diff, audioFile);
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
          <BeatmapCard
            key={b.id}
            onSelect={diffID => _onSelect(b, diffID)}
            beatmap={{
              id: b.id,
              title: b.difficulties[0].title,
              artist: b.difficulties[0].artist,
              creator: b.difficulties[0].creator,
              diffs: b.difficulties.map(d => ({
                id: d.beatmapID,
                version: d.version,
                stars: 0
              }))
            }}
          />
        ))}
      </div>
    </>
  );
}
