import { useContext } from 'react';
import OptionsContext from '../../../options';
import style from './index.module.scss';

export default function RawInputOption() {
  const { rawInput, setOptions } = useContext(OptionsContext);

  return (
    <div
      className={style.rowItem}
      onClick={() => setOptions({ rawInput: !rawInput })}
    >
      <p>Raw Input</p>
      <input type='checkbox' checked={rawInput} readOnly />
    </div>
  );
}
