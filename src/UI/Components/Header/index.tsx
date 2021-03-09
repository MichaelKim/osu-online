import { useCallback, useState } from 'react';
import BeatmapUpload, { LocalBeatmapFiles } from '../BeatmapUpload';
import Modal from '../Modal';
import style from './index.module.scss';

type Props = {
  onLoad: (beatmaps: LocalBeatmapFiles[]) => void;
};

export default function Header({ onLoad }: Props) {
  const [showModal, setModal] = useState(false);

  const onToggle = useCallback(() => setModal(m => !m), []);

  const _onLoad = useCallback(
    (beatmaps: LocalBeatmapFiles[]) => {
      setModal(false);
      onLoad(beatmaps);
    },
    [onLoad]
  );

  return (
    <div className={style.header}>
      <h1>osu!</h1>
      <button className={style.headerButton} onClick={onToggle}>
        Load Unpacked Beatmap
      </button>
      <Modal visible={showModal} onExit={onToggle}>
        <h1 className={style.title}>Load Unpacked Beatmap</h1>
        <p>Play beatmaps stored on your computer</p>
        <BeatmapUpload onSelect={_onLoad} />
      </Modal>
    </div>
  );
}
