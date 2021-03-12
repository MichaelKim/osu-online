import { useContext } from 'react';
import OptionsContext, { CursorType } from '../../../options';
import style from './index.module.scss';
import Range from './Range';

export default function CursorSensitivityOption() {
  const { cursorType, cursorSensitivity, setOptions } = useContext(
    OptionsContext
  );

  const disabled = cursorType === CursorType.DEFAULT;

  return (
    <div
      className={disabled ? style.disabledOptionsItem : style.optionsItem}
      title='How much the cursor moves relative to input movement (requires Raw Input enabled)'
    >
      <p>Cursor Sensitivity</p>
      <Range
        initialValue={cursorSensitivity}
        min={0.1}
        max={6}
        step={0.01}
        disabled={disabled}
        onChange={value =>
          setOptions({
            cursorSensitivity: value
          })
        }
      />
    </div>
  );
}
