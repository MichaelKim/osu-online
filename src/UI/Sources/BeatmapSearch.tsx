import React, { useEffect, useRef, useState } from 'react';
import LoadingCircle from '../Components/LoadingCircle';
import { useDebounce } from '../util';

type Props<T> = {
  search: string;
  limit: number;
  onSearch: (keyword: string, offset: number) => Promise<T[]>;
  children: (beatmap: T) => React.ReactNode;
};

export default function BeatmapSearch<T>({
  search,
  limit,
  children,
  onSearch
}: Props<T>) {
  const offset = useRef(0);
  const [loading, setLoading] = useState(true);
  const [beatmaps, setBeatmaps] = useState<T[]>([]);

  const debounce = useDebounce(500);

  useEffect(() => {
    setLoading(true);
    offset.current = 0;
    setBeatmaps([]);

    return debounce(async () => {
      const beatmaps = await onSearch(search, offset.current);
      setBeatmaps(beatmaps);
      setLoading(false);
    });
  }, [debounce, search, onSearch]);

  const onLoadMore = async () => {
    setLoading(true);
    offset.current += limit;

    const beatmaps = await onSearch(search, offset.current);
    setBeatmaps(b => [...b, ...beatmaps]);
    setLoading(false);
  };

  return (
    <>
      <div>{beatmaps.map(b => children(b))}</div>
      {loading ? (
        <LoadingCircle />
      ) : (
        <button onClick={onLoadMore}>Load More</button>
      )}
    </>
  );
}
