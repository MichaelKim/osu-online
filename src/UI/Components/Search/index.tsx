import { useCallback } from 'preact/hooks';
import style from './index.module.scss';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function Search({ value, onChange }: Props) {
  const _onChange = useCallback(
    (e: Event) => {
      const { value } = e.currentTarget as HTMLInputElement;
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
    />
  );
}
