import { LocalBeatmapFiles } from '../BeatmapUpload';
import AddModal from './AddModal';
import style from './index.module.scss';
import LoadModal from './LoadModal';

type Props = {
  onLoad: (beatmaps: LocalBeatmapFiles[]) => void;
};

export default function Header({ onLoad }: Props) {
  return (
    <div className={style.header}>
      <h1>osu!</h1>

      <LoadModal onLoad={onLoad} />
      <AddModal
        onLoad={() => {
          /**/
        }}
      />
    </div>
  );
}
