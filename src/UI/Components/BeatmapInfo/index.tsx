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
      <h1>
        {diff.data.title} [{diff.data.version}]
      </h1>
      {diff.data.source && <p>From {diff.data.source}</p>}
      {diff.data.artist && <p>By {diff.data.artist}</p>}
      <p>Mapped by {diff.data.creator}</p>
      <button onClick={onSelect}>Play</button>
    </div>
  );
}
