import { useCallback, useState } from 'react';
import BeatmapUpload, { BeatmapFiles } from '../BeatmapUpload';
import Modal from '../Modal';
import style from './index.module.scss';

type Props = {
  onLoad: (beatmaps: BeatmapFiles[]) => void;
};

export default function LoadModal({ onLoad }: Props) {
  const [showModal, setModal] = useState(false);

  const onToggle = useCallback(() => setModal(m => !m), []);
  const onSelect = useCallback(
    (beatmaps: BeatmapFiles[]) => {
      onToggle();
      onLoad(beatmaps);
    },
    [onToggle, onLoad]
  );

  return (
    <div className={style.headerItem} onClick={onToggle}>
      <p>Load Unpacked Beatmap</p>
      <Modal visible={showModal} onExit={onToggle}>
        <div className={style.modalHeader}>
          <h1 className={style.title}>Load Unpacked Beatmap</h1>
          <button onClick={onToggle}>Close</button>
        </div>
        <p>Play beatmaps stored on your computer</p>
        <BeatmapUpload onSelect={onSelect} />
      </Modal>
    </div>
  );
}
