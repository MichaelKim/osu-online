import JSZip from 'jszip';
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

export async function fetchOSZ(url: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const zip = await JSZip.loadAsync(blob);

  const files = await Promise.all(
    Object.values(zip.files).map(async f => ({
      file: f,
      blob: await f.async('blob')
    }))
  );

  // Find all .osu files
  const diffFiles = files.filter(f => f.file.name.endsWith('.osu'));
  const otherFiles = files
    .filter(f => !f.file.name.endsWith('.osu'))
    .map(f => ({
      name: f.file.name,
      blob: f.blob
    }));

  return { diffFiles, otherFiles };
}
