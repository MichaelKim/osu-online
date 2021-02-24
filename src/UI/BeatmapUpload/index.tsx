import React from 'react';
import { BeatmapData, parseBeatmap } from '../../Game/Loader/BeatmapLoader';
import style from './index.module.scss';

type Props = {
  onSelect: (beatmaps: BeatmapFiles[]) => void;
};

export type BeatmapFiles = {
  id: string;
  difficulties: BeatmapData[];
  files: File[];
};

export default function BeatmapUpload({ onSelect }: Props) {
  const [progress, setProgress] = React.useState(0);
  const [total, setTotal] = React.useState(0);

  const onChange = React.useCallback(
    ({ target: { files } }: React.ChangeEvent<HTMLInputElement>) => {
      if (files == null) {
        return;
      }

      const directories: Record<string, BeatmapFiles> = {};
      const beatmaps: { id: string; file: File }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Use directory name as ID
        // @ts-expect-error: non-standard API
        const path: string = file.webkitRelativePath;
        const regex = path.match(/^(.+\/)?(\d+) (.+)\/.+\.(.+)$/);
        if (regex) {
          const [, , id, , ext] = regex;

          directories[id] ??= {
            id,
            difficulties: [],
            files: []
          };

          if (ext === 'osu') {
            beatmaps.push({ id, file });
          } else {
            directories[id].files.push(file);
          }
        }
      }

      setTotal(beatmaps.length);
      setProgress(0);

      // Parse beatmaps
      Promise.all(
        beatmaps.map(async b => {
          const text = await b.file.text();
          setProgress(p => p + 1);
          return {
            id: b.id,
            data: parseBeatmap(text.split('\n').map(l => l.trim()))
          };
        })
      ).then(diffs => {
        diffs.forEach(({ id, data }) => {
          directories[id].difficulties.push(data);
        });

        // Filter folders that don't contain .osu files
        const beatmaps = Object.values(directories).filter(
          b => b.difficulties.length > 0
        );

        onSelect(beatmaps);
      });
    },
    [onSelect]
  );

  return (
    <div>
      <h1>Upload Beatmaps</h1>
      <label className={style.uploadLabel}>
        <input
          type='file'
          // @ts-expect-error: non-standard API
          webkitdirectory='true'
          onChange={onChange}
        />
        Upload Beatmaps
      </label>

      {total > 0 && (
        <p>
          Loaded {progress} of {total}...
        </p>
      )}
    </div>
  );
}
