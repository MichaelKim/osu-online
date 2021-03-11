import { FormEvent, useState } from 'react';
import ReactTooltip from 'react-tooltip';
import style from './index.module.scss';

function useDebounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
) {
  const [id, setID] = useState<number>();
  return (...args: T) => {
    clearTimeout(id);
    setID(window.setTimeout(() => fn(...args), delay));
  };
}

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
  const _onChange = useDebounce(onChange, 50);

  const onInput = (e: FormEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.currentTarget.value);
    setValue(newValue);
    _onChange(newValue);
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
        className={style.range}
      />
      <ReactTooltip id='range'>
        <p>
          {value.toLocaleString('en-US', {
            minimumFractionDigits: 2
          })}
        </p>
      </ReactTooltip>
    </>
  );
}