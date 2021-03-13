import { useContext, useEffect, useState } from 'react';
import OptionsContext from '../../../options';
import Modal from '../../Modal';
import style from './index.module.scss';

type Props = {
  label: string;
  value: string;
  onChange: (key: string) => void;
};

function KeyBinding({ label, value, onChange }: Props) {
  const [edit, setEdit] = useState(false);
  const onClick = () => setEdit(true);
  const onExit = () => setEdit(false);

  useEffect(() => {
    if (edit) {
      const listener = (e: KeyboardEvent) => {
        onChange(e.key);
        onExit();
      };
      document.addEventListener('keydown', listener);

      return () => document.removeEventListener('keydown', listener);
    }
  }, [edit, onChange]);

  return (
    <div className={style.rowItem} onClick={onClick}>
      <p>{label}</p>
      <p>{value}</p>
      <Modal visible={edit} onExit={onExit}>
        <div className={style.keyBindingModal}>
          <p>Enter new key for {label}</p>
          <button onClick={onExit}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

export default function KeyBindingsOption() {
  const { leftButton, rightButton, setOptions } = useContext(OptionsContext);

  return (
    <div>
      <KeyBinding
        label='Left Button'
        value={leftButton}
        onChange={leftButton => setOptions({ leftButton })}
      />
      <KeyBinding
        label='Right Button'
        value={rightButton}
        onChange={rightButton => setOptions({ rightButton })}
      />
    </div>
  );
}
