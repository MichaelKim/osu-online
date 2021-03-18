import { useCallback, useState } from 'react';
import CheeseGull from '../../Sources/CheeseGull';
import Sayobot from '../../Sources/Sayobot';
import { BeatmapFiles } from '../BeatmapUpload';
import Modal from '../Modal';
import Search from '../Search';
import style from './index.module.scss';

type Props = {
  onAdd: (beatmaps: BeatmapFiles[]) => void;
};

enum BeatmapServer {
  RIPPLE = 'ripple',
  SAYOBOT = 'sayobot'
}

export default function AddModal({ onAdd }: Props) {
  const [showModal, setModal] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [server, setServer] = useState(BeatmapServer.RIPPLE);

  const onToggle = useCallback(() => setModal(m => !m), []);
  const onServerChange = () =>
    setServer(s =>
      s === BeatmapServer.RIPPLE ? BeatmapServer.SAYOBOT : BeatmapServer.RIPPLE
    );

  const Server = server === BeatmapServer.RIPPLE ? CheeseGull : Sayobot;

  return (
    <div className={style.headerItem} onClick={onToggle}>
      <p>Add Beatmap</p>
      <Modal
        visible={showModal}
        keepOpen
        onExit={onToggle}
        className={style.sayobot}
      >
        <div className={style.modalHeader}>
          <h1 className={style.title}>Beatmap Listing</h1>
          <label>
            Search Server:
            <select value={server} onChange={onServerChange}>
              <option value={BeatmapServer.RIPPLE}>Ripple</option>
              <option value={BeatmapServer.SAYOBOT}>Sayobot</option>
            </select>
          </label>
          <button onClick={onToggle}>Close</button>
        </div>
        {/* Reload Search for autofocus */}
        {showModal && <Search value={keyword} onChange={setKeyword} />}
        <div className={style.section}>
          <Server search={keyword} onSelect={onAdd} />
        </div>
      </Modal>
    </div>
  );
}
