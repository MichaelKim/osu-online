import { useState } from 'react';
import { BeatmapFile } from '../../../Game';
import {
  BeatmapData,
  GameMode,
  parseBeatmap
} from '../../../Game/Loader/BeatmapLoader';
import { getFilesFromDrop } from './dragDrop';
import style from './index.module.scss';
import { Directory, getBeatmaps, loadBeatmapDiff } from './loadBeatmaps';
import { getFilesFromInput } from './webkitDirectory';

type Props = {
  onSelect: (beatmaps: BeatmapFiles[]) => void;
};

// Unified info for beatmap info / card
export type BeatmapInfo = {
  creator: string;
  version: string;
  stars: number;
  background: string;
  length: number;
};

export type BeatmapDiff = {
  info: BeatmapInfo;
  data: BeatmapData;
};

export type BeatmapFiles = {
  info: {
    id: number;
    title: string;
    artist: string;
    creator: string;
    background: string;
  };
  difficulties: BeatmapDiff[];
  files: BeatmapFile[];
};

export default function BeatmapUpload({ onSelect }: Props) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const loadBeatmaps = async (root: Directory) => {
    const beatmapFiles = getBeatmaps(root);

    const total = beatmapFiles.reduce((sum, b) => sum + b.diffs.length, 0);
    setTotal(total);
    setProgress(0);

    // Parse beatmaps
    const beatmaps: BeatmapFiles[] = [];

    for (const beatmap of beatmapFiles) {
      const diffs: BeatmapDiff[] = [];

      for (const diff of beatmap.diffs) {
        const text = await diff.text();
        const data = parseBeatmap(text);
        if (data.mode === GameMode.STANDARD) {
          diffs.push(loadBeatmapDiff(data, beatmap.files));
        }
        setProgress(p => p + 1);
      }

      if (diffs.length > 0) {
        beatmaps.push({
          info: {
            id: diffs[0].data.beatmapSetID,
            title: diffs[0].data.title,
            artist: diffs[0].data.artist,
            creator: diffs[0].data.creator,
            background: diffs[0].info.background
          },
          difficulties: diffs,
          files: beatmap.files
        });
      }
    }

    onSelect(beatmaps);
  };

  const onChange = ({
    target: { files }
  }: React.ChangeEvent<HTMLInputElement>) => {
    if (files == null) {
      return;
    }

    loadBeatmaps(getFilesFromInput(files));
  };

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);

    if (e.dataTransfer?.items == null) {
      return;
    }

    loadBeatmaps(await getFilesFromDrop(e.dataTransfer.items));
  };

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
