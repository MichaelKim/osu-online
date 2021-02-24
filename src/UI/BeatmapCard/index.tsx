import React from 'react';
import { BeatmapData } from '../../Game/Loader/BeatmapLoader';
import { BeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';

type Props = {
  beatmap: BeatmapFiles;
  onSelect: (id: string, data: BeatmapData, audioFile: File) => void;
};

export default function BeatmapCard({ beatmap, onSelect }: Props) {
  const loadDiff = (data: BeatmapData) => {
    console.log('Load', data);
    const audioFile = beatmap.files.find(f => f.name === data.audioFilename);
    if (audioFile == null) {
      console.error('Missing audio file!');
      return;
    }

    onSelect(beatmap.id, data, audioFile);
  };

  const { title, artist, creator } = beatmap.difficulties[0];

  return (
    <div className={style.beatmapCard}>
      <div className={style.cardBox}>
        <div className={style.cardUpper}>
          <div className={style.cardUpperBox}>
            <p>{artist}</p>
            <p className={style.cardTitle}>{title}</p>
          </div>
        </div>
        <div className={style.cardLower}>
          <p>Mapped by {creator}</p>
          <div className={style.cardLowerBox}>
            {beatmap.difficulties.map(d => (
              <div
                key={d.version}
                onClick={() => loadDiff(d)}
                className={style.difficultyCircle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
