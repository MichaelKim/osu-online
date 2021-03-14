import { BeatmapFiles } from '../BeatmapUpload';
import AddModal from './AddModal';
import style from './index.module.scss';
import LoadModal from './LoadModal';
import Options from './Options';

type Props = {
  onAdd: (beatmaps: BeatmapFiles[]) => void;
};

export default function Header({ onAdd }: Props) {
  return (
    <div className={style.header}>
      <div className={style.headerLogo}>
        <h1>osu!</h1>
      </div>

      <LoadModal onLoad={onAdd} />
      <AddModal onAdd={onAdd} />
      <Options />
    </div>
  );
}
