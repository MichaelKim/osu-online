import { useCallback, useState } from 'react';
import { SayobotBeatmapFiles } from '../../API/SayobotAPI';
import Sayobot from '../../Sources/Sayobot';
import Modal from '../Modal';
import Search from '../Search';
import style from './index.module.scss';

type Props = {
  onLoad: (beatmap: SayobotBeatmapFiles) => void;
};

export default function AddModal({ onLoad }: Props) {
  const [showModal, setModal] = useState(false);
  const [keyword, setKeyword] = useState('');

  const onToggle = useCallback(() => setModal(m => !m), []);

  return (
    <>
      <button className={style.headerButton} onClick={onToggle}>
        Add Beatmap
      </button>
      <Modal visible={showModal} keepOpen onExit={onToggle}>
        <div className={style.load}>
          <h1 className={style.title}>Beatmap Listing</h1>
          <button onClick={onToggle} className={style.close}>
            Close
          </button>
          <Search value={keyword} onChange={setKeyword} />
          <div className={style.section}>
            <Sayobot search={keyword} onSelect={onLoad} />
          </div>
        </div>
      </Modal>
    </>
  );
}
