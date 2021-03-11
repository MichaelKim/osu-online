import { SayobotBeatmapFiles } from '../../API/SayobotAPI';
import { BeatmapFiles } from '../BeatmapUpload';
import AddModal from './AddModal';
import style from './index.module.scss';
import LoadModal from './LoadModal';
import Options from './Options';

type Props = {
  onLoad: (beatmaps: BeatmapFiles[]) => void;
  onSayobotAdd: (beatmap: SayobotBeatmapFiles) => void;
};

export default function Header({ onLoad, onSayobotAdd }: Props) {
  return (
    <div className={style.header}>
      <h1>osu!</h1>

      <LoadModal onLoad={onLoad} />
      <AddModal onLoad={onSayobotAdd} />
      <Options />
    </div>
  );
}
