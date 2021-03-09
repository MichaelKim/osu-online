import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import style from './index.module.scss';

type Props = {
  diff?: BeatmapData;
  onSelect: () => void;
};

export default function BeatmapInfo({ diff, onSelect }: Props) {
  return (
    <div className={style.info}>
      {diff && (
        <>
          {diff.title}
          {diff.version}
          <button onClick={onSelect}>Play</button>
        </>
      )}
    </div>
  );
}
