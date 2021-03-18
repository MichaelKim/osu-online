import * as React from 'react';
import style from './index.module.scss';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function Search({ value, onChange }: Props) {
  const _onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.currentTarget;
      onChange(value);
    },
    [onChange]
  );

  return (
    <input
      type='text'
      placeholder='Search for beatmaps...'
      className={style.searchInput}
      value={value}
      onChange={_onChange}
      autoFocus
    />
  );
}
