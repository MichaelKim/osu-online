import { useState } from 'react';
import ReactTooltip from 'react-tooltip';

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

export default function Range({
  initialValue,
  onChange
}: {
  initialValue: number;
  onChange: (value: number) => void;
}) {
  const [value, setValue] = useState(initialValue);
  const _onChange = useDebounce(onChange, 25);

  return (
    <>
      <input
        type='range'
        min={0.1}
        max={6}
        step={0.01}
        value={value}
        onInput={e => {
          const newValue = parseFloat(e.currentTarget.value);
          setValue(newValue);
          _onChange(newValue);
        }}
        data-tip
        data-for='range'
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
