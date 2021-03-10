import DifficultyCircle from '../DifficultyCircle';
import style from './index.module.scss';

type BeatmapInfo = {
  title: string;
  artist: string;
  creator: string;
  diffs: {
    id: number;
    version: string;
    stars: number;
  }[];
  bg?: string;
};

type Props = {
  beatmap: BeatmapInfo;
  onSelect: () => void;
};

export default function BeatmapCard({ beatmap, onSelect }: Props) {
  return (
    <div className={style.beatmapCard}>
      <div className={style.cardBox}>
        <div
          className={style.cardUpper}
          style={beatmap.bg ? { backgroundImage: `url(${beatmap.bg})` } : {}}
        >
          <div className={style.cardUpperBox}>
            <p>{beatmap.artist}</p>
            <p className={style.cardTitle}>{beatmap.title}</p>
          </div>
        </div>
        <div className={style.cardLower}>
          <div className={style.cardLowerInfo}>
            <p>Mapped by {beatmap.creator}</p>
            <div className={style.cardLowerDiffs}>
              {beatmap.diffs.map(d => (
                <DifficultyCircle
                  key={`${d.id}-${d.version}`}
                  id={`${d.id}-${d.version}`}
                  version={d.version}
                  stars={d.stars}
                />
              ))}
            </div>
          </div>
          <div className={style.addBox}>
            <button onClick={onSelect}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
