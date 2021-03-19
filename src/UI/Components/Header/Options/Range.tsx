import { useState } from 'react';
import ReactTooltip from 'react-tooltip';
import { useDebounce } from '../../../util';
import style from './index.module.scss';

type Props = {
  initialValue: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export default function Range({
  initialValue,
  min,
  max,
  step,
  disabled = false,
  onChange
}: Props) {
  const [value, setValue] = useState(initialValue);
  const debounce = useDebounce(50);

  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.currentTarget.value);
    setValue(newValue);
    debounce(onChange, newValue);
  };

  return (
    <>
      <input
        type='range'
        value={value}
        min={min}
        max={max}
        step={step}
        onInput={onInput}
        data-tip
        data-for='range'
        disabled={disabled}
        className={disabled ? style.disabledRange : style.range}
      />
      <ReactTooltip id='range'>
        <p>
          {value.toLocaleString('en-US', {
            minimumFractionDigits: 2
          })}
          x
        </p>
      </ReactTooltip>
    </>
  );
}
