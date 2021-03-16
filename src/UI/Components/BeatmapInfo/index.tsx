import { BeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';

type Props = {
  beatmap?: BeatmapFiles;
  version?: string;
  onSelect: () => void;
};

export default function BeatmapInfo({ beatmap, version, onSelect }: Props) {
  const diff = beatmap?.difficulties.find(d => d.data.version === version);

  if (beatmap == null || diff == null) {
    return <div className={style.info} />;
  }

  const min = Math.floor(diff.info.length / 60);
  const sec = Math.floor(diff.info.length % 60)
    .toString()
    .padStart(2, '0');

  return (
    <div className={style.info}>
      <div
        className={style.bg}
        style={
          diff.info.background
            ? {
                backgroundImage: `url(${diff.info.background})`
              }
            : {}
        }
      />
      <div className={style.metadata}>
        <h1>
          {diff.data.title} [{diff.data.version}]
        </h1>
        {diff.data.source && <p>From {diff.data.source}</p>}
        {diff.data.artist && <p>By {diff.data.artist}</p>}
        <p>Mapped by {diff.data.creator}</p>

        <p>
          Length: {min}:{sec}
        </p>
      </div>
      <button className={style.playButton} onClick={onSelect}>
        Play
      </button>
    </div>
  );
}
