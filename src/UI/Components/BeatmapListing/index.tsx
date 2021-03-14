import { useCallback, useState } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import BeatmapBar from '../BeatmapBar';
import BeatmapInfo from '../BeatmapInfo';
import { BeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';

type Props = {
  beatmaps: BeatmapFiles[];
  onSelect: (data: BeatmapData, files: BeatmapFile[]) => void;
};

export default function BeatmapListing({ beatmaps, onSelect }: Props) {
  const [selectedBeatmap, setSelected] = useState<BeatmapFiles>();
  const [selectedVersion, setVersion] = useState<string>();

  const onClick = useCallback(
    (beatmap: BeatmapFiles) => {
      if (beatmap === selectedBeatmap) return;

      setSelected(beatmap);
      setVersion(beatmap.difficulties[0].data.version);
    },
    [selectedBeatmap]
  );

  const onPlay = useCallback(() => {
    // Find diff
    const diff = selectedBeatmap?.difficulties.find(
      d => d.data.version === selectedVersion
    );

    if (diff == null || selectedBeatmap == null) return;

    onSelect(diff.data, selectedBeatmap.files);
  }, [selectedBeatmap, selectedVersion, onSelect]);

  const onClickDiff = useCallback(
    (version: string) => {
      if (version === selectedVersion) return;

      setVersion(version);
    },
    [selectedVersion]
  );

  return (
    <div className={style.container}>
      <BeatmapInfo
        beatmap={selectedBeatmap}
        version={selectedVersion}
        onSelect={onPlay}
      />
      <div className={style.list}>
        {beatmaps.map(b => (
          <BeatmapBar
            key={b.info.id + '-' + b.difficulties[0].data.version}
            beatmap={b}
            expanded={selectedBeatmap === b}
            onClick={onClick}
            onClickDiff={onClickDiff}
          />
        ))}
      </div>
    </div>
  );
}
