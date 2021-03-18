import { useCallback, useRef } from 'react';
import { parse } from 'uzip';

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

export async function fetchOSZ(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const buffer = await blob.arrayBuffer();

  const data = parse(buffer);
  const files = Object.entries(data).map(([name, arr]) => ({
    name,
    blob: new Blob([arr])
  }));

  // Find all .osu files
  const diffFiles = files
    .filter(({ name }) => name.endsWith('.osu'))
    .map(({ blob }) => blob);
  const otherFiles = files.filter(({ name }) => !name.endsWith('.osu'));

  return { diffFiles, otherFiles };
}
