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

function DiffCircles({ beatmap }: { beatmap: BeatmapInfo }) {
  if (beatmap.diffs.length <= 10) {
    return (
      <>
        {beatmap.diffs.map(d => (
          <DifficultyCircle
            key={d.version}
            beatmapID={beatmap.id}
            version={d.version}
            stars={d.stars}
          />
        ))}
      </>
    );
  }

  const lastDiff = beatmap.diffs[beatmap.diffs.length - 1];

  return (
    <>
      <DifficultyCircle beatmapID={beatmap.id} stars={lastDiff.stars} />
      <p>{beatmap.diffs.length}</p>
    </>
  );
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
          style={{
            backgroundImage: `url(${beatmap.bg}), url('default-bg.webp')`
          }}
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
              <DiffCircles beatmap={beatmap} />
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
