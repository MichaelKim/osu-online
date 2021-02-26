import React from 'react';
import style from './index.module.scss';

type Props = {
  onChange: (value: string) => void;
};

export default function Search({ onChange }: Props) {
  const [value, setValue] = React.useState('');

  const _onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.currentTarget;
      setValue(value);
      onChange(value);
    },
    [onChange]
  );

  return (
    <input
      type='text'
      placeholder='Search for beatmaps...'
      className={style.searchInput}
      onChange={_onChange}
      value={value}
    />
  );
}
