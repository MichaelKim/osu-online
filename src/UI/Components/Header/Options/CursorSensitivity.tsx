import { useContext } from 'react';
import OptionsContext from '../../../options';
import style from './index.module.scss';
import Range from './Range';

export default function CursorSensitivityOption() {
  const { rawInput, cursorSensitivity, setOptions } = useContext(
    OptionsContext
  );

  return (
    <div
      className={style.optionsItem}
      style={{
        filter: rawInput ? 'none' : 'brightness(0.5)'
      }}
    >
      <p>Cursor Sensitivity</p>
      <Range
        initialValue={cursorSensitivity}
        min={0.1}
        max={6}
        step={0.01}
        disabled={!rawInput}
        onChange={value =>
          setOptions({
            cursorSensitivity: value
          })
        }
      />
    </div>
  );
}
