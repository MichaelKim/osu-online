import { useCallback } from 'react';
import DifficultyCircle from '../DifficultyCircle';
import style from './index.module.scss';

type BeatmapDiffInfo = {
  key: string;
  version: string;
  stars: number;
};

type BeatmapInfo = {
  title: string;
  artist: string;
  creator: string;
  diffs: BeatmapDiffInfo[];
  bg?: string;
};

type DiffProps = {
  creator: string;
  diff: BeatmapDiffInfo;
  onClick: (version: string) => void;
};

function BeatmapDiffBar({ creator, diff, onClick }: DiffProps) {
  const _onClick = useCallback(() => onClick(diff.version), [
    onClick,
    diff.version
  ]);

  return (
    <div className={style.diff} onClick={_onClick}>
      <DifficultyCircle size={40} {...diff} />
      <div className={style.diffInfo}>
        <div className={style.diffMeta}>
          <p className={style.version}>{diff.version}</p>
          <p>mapped by {creator}</p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  beatmap: BeatmapInfo;
  expanded: boolean;
  onClick: () => void;
  onClickDiff: (version: string) => void;
};

export default function BeatmapBar({
  beatmap,
  expanded,
  onClick,
  onClickDiff
}: Props) {
  return (
    <>
      <div
        className={style.bar}
        style={beatmap.bg ? { backgroundImage: `url(${beatmap.bg})` } : {}}
        onClick={onClick}
      >
        <div className={style.fade}>
          <p className={style.title}>{beatmap.title}</p>
          <p className={style.artist}>{beatmap.artist}</p>
          <div className={style.diffCircleBox}>
            {beatmap.diffs.map(d => (
              <DifficultyCircle
                key={d.key}
                size={16}
                version={d.version}
                stars={d.stars}
              />
            ))}
          </div>
        </div>
      </div>
      {expanded &&
        beatmap.diffs.map(d => (
          <BeatmapDiffBar
            key={d.key}
            creator={beatmap.creator}
            diff={d}
            onClick={onClickDiff}
          />
        ))}
    </>
  );
}
