import { memo, useEffect, useState } from 'react';
import { BeatmapFiles, BeatmapInfo } from '../BeatmapUpload';
import DifficultyCircle from '../DifficultyCircle';
import style from './index.module.scss';

type DiffProps = {
  beatmapID: number;
  creator: string;
  diff: BeatmapInfo;
  onClick: (version: string) => void;
};

function DiffBar({ beatmapID, creator, diff, onClick }: DiffProps) {
  const _onClick = () => onClick(diff.version);

  return (
    <div className={style.diff} onClick={_onClick}>
      <DifficultyCircle
        size={40}
        beatmapID={beatmapID}
        version={diff.version}
        stars={diff.stars}
      />
      <div className={style.diffInfo}>
        <div className={style.diffMeta}>
          <p className={style.version}>{diff.version}</p>
          <p>mapped by {creator}</p>
        </div>
      </div>
    </div>
  );
}

export const BeatmapDiffBar = memo(DiffBar);

type Props = {
  beatmap: BeatmapFiles;
  onClick: (beatmap: BeatmapFiles) => void;
};

function BeatmapBar({ beatmap, onClick }: Props) {
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setRendered(true);
    }, 100);

    return () => window.clearTimeout(id);
  }, []);

  if (!rendered) {
    return <div className={style.bar} />;
  }

  const _onClick = () => onClick(beatmap);
  const background = beatmap.info.background;
  return (
    <div className={style.bar} onClick={_onClick}>
      <div
        className={style.fadein}
        style={{
          backgroundImage: background ? `url(${background})` : ''
        }}
      >
        <div className={style.fade}>
          <p className={style.title}>{beatmap.info.title}</p>
          <p className={style.artist}>{beatmap.info.artist}</p>
          <div className={style.diffCircleBox}>
            {beatmap.difficulties.map(d => (
              <DifficultyCircle
                key={d.info.version}
                size={16}
                beatmapID={beatmap.info.id}
                version={d.info.version}
                stars={d.info.stars}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(BeatmapBar);
