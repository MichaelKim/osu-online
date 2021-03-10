import * as React from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData, parseBeatmap } from '../../../Game/Loader/BeatmapLoader';
import { getFilesFromDrop } from './dragDrop';
import style from './index.module.scss';
import { Directory, getBeatmaps } from './loadBeatmaps';
import { getFilesFromInput } from './webkitDirectory';

type Props = {
  onSelect: (beatmaps: BeatmapFiles[]) => void;
};

export type BeatmapFiles = {
  difficulties: BeatmapData[];
  files: BeatmapFile[];
};

export default function BeatmapUpload({ onSelect }: Props) {
  const [dragging, setDragging] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [total, setTotal] = React.useState(0);

  const loadBeatmaps = React.useCallback(
    async (root: Directory) => {
      const beatmapFiles = getBeatmaps(root);

      const total = beatmapFiles.reduce((sum, b) => sum + b.diffs.length, 0);
      setTotal(total);
      setProgress(0);

      // Parse beatmaps
      const beatmaps = await Promise.all(
        beatmapFiles.map(async beatmap => {
          const diffs = await Promise.all(
            beatmap.diffs.map(async diff => {
              const text = await diff.text();
              const data = parseBeatmap(text.split('\n').map(l => l.trim()));
              setProgress(p => p + 1);
              return data;
            })
          );

          return {
            difficulties: diffs,
            files: beatmap.files
          };
        })
      );

      onSelect(beatmaps);
    },
    [onSelect]
  );

  const onChange = React.useCallback(
    ({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
      if (files == null) {
        return;
      }

      loadBeatmaps(getFilesFromInput(files));
    },
    [loadBeatmaps]
  );

  const onDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);

      if (e.dataTransfer?.items == null) {
        return;
      }

      loadBeatmaps(await getFilesFromDrop(e.dataTransfer.items));
    },
    [loadBeatmaps]
  );

  if (total > 0) {
    return (
      <div className={style.dragDrop}>
        <p>
          Loaded {progress} of {total}...
        </p>
      </div>
    );
  }

  return (
    <div
      className={style.dragDrop}
      onDragEnter={onDragEnter}
      onDragOver={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {dragging ? (
        <p>DROP HERE</p>
      ) : (
        <>
          <p>Drag & drop a beatmap folder here</p>
          <p className={style.or}>OR</p>

          <label className={style.browseButton}>
            <input
              type='file'
              // @ts-expect-error: non-standard API
              webkitdirectory='true'
              onChange={onChange}
              multiple
            />
            Browse files
          </label>
        </>
      )}
    </div>
  );
}
