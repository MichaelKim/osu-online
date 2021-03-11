import { useContext } from 'react';
import OptionsContext from '../../../options';
import style from './index.module.scss';

export default function RawInputOption() {
  const { rawInput, supportsRawInput, setOptions } = useContext(OptionsContext);

  const onClick = () => {
    supportsRawInput && setOptions({ rawInput: !rawInput });
  };

  if (!supportsRawInput) {
    return (
      <>
        <p>
          To enable raw input, use Chrome and enable the{' '}
          <em>chrome://flags/#enable-pointer-lock-options</em> flag. See{' '}
          <a href='https://www.chromestatus.com/feature/5723553087356928'>
            this
          </a>{' '}
          for more details.
        </p>
        <div
          className={style.rowItem}
          style={{
            filter: 'brightness(0.5)'
          }}
        >
          <p>Raw Input</p>
          <input type='checkbox' checked={false} disabled readOnly />
        </div>
      </>
    );
  }

  return (
    <div className={style.rowItem} onClick={onClick}>
      <p>Raw Input</p>
      <input type='checkbox' checked={rawInput} readOnly />
    </div>
  );
}
