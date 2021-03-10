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
    <>
      <button className={style.headerButton} onClick={onToggle}>
        Load Unpacked Beatmap
      </button>
      <Modal visible={showModal} onExit={onToggle}>
        <h1 className={style.title}>Load Unpacked Beatmap</h1>
        <p>Play beatmaps stored on your computer</p>
        <BeatmapUpload onSelect={onSelect} />
      </Modal>
    </>
  );
}
