import { useCallback, useRef } from 'react';

export function useDebounce(delay: number) {
  const id = useRef<number>(0);
  const debounce = useCallback(
    <T extends unknown[]>(fn: (...args: T) => void, ...args: T) => {
      clearTimeout(id.current);
      id.current = window.setTimeout(() => fn(...args), delay);

      return () => clearTimeout(id.current);
    },
    [delay]
  );

  return debounce;
}
