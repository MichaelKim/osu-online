import { useState } from 'react';
import Modal from '../../Modal';
import style from '../index.module.scss';
import CursorSensitivityOption from './CursorSensitivity';
import optionsStyle from './index.module.scss';
import KeyBindingsOption from './KeyBindingsOption';
import RawInputOption from './RawInput';

export default function Options() {
  const [showModal, setModal] = useState(false);
  const onToggle = () => setModal(m => !m);

  return (
    <div className={style.headerItem} onClick={onToggle}>
      <p>Options</p>
      <Modal
        visible={showModal}
        onExit={onToggle}
        className={optionsStyle.options}
      >
        <div className={style.modalHeader}>
          <h1 className={style.title}>Options</h1>
          <button onClick={onToggle}>Close</button>
        </div>

        <h2>Mouse</h2>
        <RawInputOption />
        <CursorSensitivityOption />

        <h2>Keyboard</h2>
        <KeyBindingsOption />
      </Modal>
    </div>
  );
}
