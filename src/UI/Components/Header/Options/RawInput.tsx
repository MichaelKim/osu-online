import { useContext } from 'react';
import OptionsContext, { CursorType } from '../../../options';
import style from './index.module.scss';

export default function RawInputOption() {
  const { cursorType, supportsRawInput, setOptions } = useContext(
    OptionsContext
  );

  const setCursorType = (type: CursorType) => setOptions({ cursorType: type });

  const onLock = () =>
    setCursorType(
      cursorType === CursorType.DEFAULT ? CursorType.LOCKED : CursorType.DEFAULT
    );

  const onRaw = () =>
    supportsRawInput &&
    setCursorType(
      cursorType === CursorType.UNADJUSTED
        ? CursorType.LOCKED
        : CursorType.UNADJUSTED
    );

  return (
    <>
      <div
        className={style.rowItem}
        onClick={onLock}
        title='Restricts cursor to browser window'
      >
        <p>Raw Input</p>
        <input
          type='checkbox'
          checked={cursorType !== CursorType.DEFAULT}
          readOnly
        />
      </div>
      {!supportsRawInput && (
        <p>
          To disable mouse acceleration, use Chrome and enable the{' '}
          <em>chrome://flags/#enable-pointer-lock-options</em> flag. See{' '}
          <a href='https://www.chromestatus.com/feature/5723553087356928'>
            this
          </a>{' '}
          for more details.
        </p>
      )}
      <div
        className={supportsRawInput ? style.rowItem : style.disabledRowItem}
        onClick={onRaw}
        title='Disables OS-level mouse acceleration'
      >
        <p>Disable Mouse Acceleration</p>
        <input
          type='checkbox'
          checked={supportsRawInput && cursorType === CursorType.UNADJUSTED}
          readOnly
          disabled={!supportsRawInput}
        />
      </div>
    </>
  );
}
