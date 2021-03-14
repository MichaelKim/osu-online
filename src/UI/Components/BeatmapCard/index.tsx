import { useState } from 'react';
import DifficultyCircle from '../DifficultyCircle';
import LoadingCircle from '../LoadingCircle';
import style from './index.module.scss';

type BeatmapInfo = {
  id: number;
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
  onSelect: () => Promise<void>;
};

enum State {
  NONE,
  ADDING,
  ADDED
}

export default function BeatmapCard({ beatmap, onSelect }: Props) {
  const [state, setState] = useState(State.NONE);

  const _onSelect = async () => {
    setState(State.ADDING);
    await onSelect();
    setState(State.ADDED);
  };

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
                  key={d.version}
                  beatmapID={beatmap.id}
                  version={d.version}
                  stars={d.stars}
                />
              ))}
            </div>
          </div>
          <div className={style.addBox}>
            {state === State.NONE ? (
              <button onClick={_onSelect}>Add</button>
            ) : state === State.ADDING ? (
              <LoadingCircle />
            ) : (
              <div>Added</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
