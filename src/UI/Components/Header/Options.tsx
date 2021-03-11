import React, { useContext, useState } from 'react';
import OptionsContext from '../../options';
import Modal from '../Modal';
import style from './index.module.scss';
import Range from './Range';

export default function Options() {
  const [showModal, setModal] = useState(false);
  const { cursorSensitivity, test, setOptions } = useContext(OptionsContext);

  const onToggle = () => setModal(m => !m);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setOptions({
      test: e.target.value
    });

  const onCursorChange = (value: number) =>
    setOptions({
      cursorSensitivity: value
    });

  return (
    <>
      <button className={style.headerButton} onClick={onToggle}>
        Options
      </button>
      <Modal visible={showModal} onExit={onToggle}>
        <div className={style.load}>
          <h1 className={style.title}>Options</h1>
          <button onClick={onToggle} className={style.close}>
            Close
          </button>
          <input type='text' value={test} onChange={onChange} />
          <Range initialValue={cursorSensitivity} onChange={onCursorChange} />
          <p>stuff</p>
        </div>
      </Modal>
    </>
  );
}
