import { useContext, useState } from 'react';
import OptionsContext, { CursorType } from '../../../options';
import Modal from '../../Modal';
import style from './index.module.scss';

function RawInputNotSupported() {
  const [showModal, setModal] = useState(false);
  const onToggle = () => setModal(m => !m);

  return (
    <div className={style.rowItem}>
      <p>Your browser does not support disabling mouse acceleration!</p>{' '}
      <button onClick={onToggle}>Why?</button>
      <Modal
        visible={showModal}
        onExit={onToggle}
        className={style.mouseAccelerationModal}
      >
        <button onClick={onToggle}>Close</button>
        <p>
          Disabling mouse acceleration is a new browser feature and is only
          available on Chrome 88+.
        </p>
        <br />
        <p>
          To disable mouse acceleration, go to <em>chrome://flags</em> and
          search for <b>Enables pointer lock options</b>. Enable the{' '}
          <em>flags/#enable-pointer-lock-options</em> flag and restart Chrome.
        </p>
        <br />
        <p>
          Alternatively, try turning off mouse acceleration within your OS&apos;
          settings.
        </p>
        <ul>
          <li>
            For Windows, go to Control Panel &gt; Mouse &gt; Pointer Options
            &gt; uncheck <b>Enhance pointer precision</b>.
          </li>
          <li>
            For MacOS, open Terminal and enter{' '}
            <code>
              defaults write .GlobalPreferences com.apple.mouse.scaling -1
            </code>
            .
          </li>
          <li>
            For Chrome OS, go to Settings &gt; Device &gt; Mouse and touchpad.
          </li>
        </ul>
        <p>
          See{' '}
          <a
            href='https://web.dev/disable-mouse-acceleration'
            target='_blank'
            rel='noreferrer'
          >
            this
          </a>{' '}
          for more details.
        </p>
      </Modal>
    </div>
  );
}

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
      {!supportsRawInput && <RawInputNotSupported />}
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
