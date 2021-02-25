import React from 'react';
import style from './index.module.scss';

export type BeatmapInfo = {
  id: number;
  title: string;
  artist: string;
  creator: string;
  diffs: {
    id: number;
    version: string;
    stars: number;
  }[];
};

type Props = {
  beatmap: BeatmapInfo;
  onSelect: (diffID: number) => void;
};

export default function BeatmapCard({ beatmap, onSelect }: Props) {
  return (
    <div className={style.beatmapCard}>
      <div className={style.cardBox}>
        <div className={style.cardUpper}>
          <div className={style.cardUpperBox}>
            <p>{beatmap.artist}</p>
            <p className={style.cardTitle}>{beatmap.title}</p>
          </div>
        </div>
        <div className={style.cardLower}>
          <p>Mapped by {beatmap.creator}</p>
          <div className={style.cardLowerBox}>
            {beatmap.diffs.map(d => (
              <div
                key={`${d.id}-${d.version}`}
                onClick={() => onSelect(d.id)}
                className={style.difficultyCircle}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
