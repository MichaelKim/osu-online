import { BeatmapFiles, BeatmapInfo } from '../BeatmapUpload';
import DifficultyCircle from '../DifficultyCircle';
import style from './index.module.scss';

type DiffProps = {
  beatmapID: number;
  creator: string;
  diff: BeatmapInfo;
  onClick: (version: string) => void;
};

function BeatmapDiffBar({ beatmapID, creator, diff, onClick }: DiffProps) {
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

type Props = {
  beatmap: BeatmapFiles;
  expanded: boolean;
  onClick: (beatmap: BeatmapFiles) => void;
  onClickDiff: (version: string) => void;
};

export default function BeatmapBar({
  beatmap,
  expanded,
  onClick,
  onClickDiff
}: Props) {
  const _onClick = () => onClick(beatmap);

  const background = beatmap.info.background;
  return (
    <>
      <div
        className={style.bar}
        style={background ? { backgroundImage: `url(${background})` } : {}}
        onClick={_onClick}
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
      {expanded &&
        beatmap.difficulties.map(d => (
          <BeatmapDiffBar
            key={d.info.version}
            beatmapID={beatmap.info.id}
            creator={beatmap.info.creator}
            diff={d.info}
            onClick={onClickDiff}
          />
        ))}
    </>
  );
}
