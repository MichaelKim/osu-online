import { useCallback, useState } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import { SayobotBeatmapFiles } from '../../Sources/Sayobot';
import BeatmapBar from '../BeatmapBar';
import BeatmapInfo from '../BeatmapInfo';
import { BeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';

type Props = {
  beatmaps: BeatmapFiles[];
  sayobot: SayobotBeatmapFiles[];
  onSelect: (data: BeatmapData, files: BeatmapFile[]) => void;
};

export default function BeatmapListing({ beatmaps, sayobot, onSelect }: Props) {
  const [selectedBeatmap, setSelected] = useState<BeatmapFiles>();
  const [selectedVersion, setVersion] = useState<string>();

  // Find diff
  const diff = selectedBeatmap?.difficulties.find(
    d => d.data.version === selectedVersion
  );

  const onClick = useCallback(
    (beatmap: BeatmapFiles) => {
      if (beatmap === selectedBeatmap) {
        return;
      }

      setSelected(beatmap);
      setVersion(beatmap.difficulties[0].data.version);
    },
    [selectedBeatmap]
  );

  const onPlay = useCallback(() => {
    if (diff == null || selectedBeatmap == null) return;

    onSelect(diff.data, selectedBeatmap.files);
  }, [diff, selectedBeatmap, onSelect]);

  const onClickDiff = useCallback(
    (version: string) => {
      if (version === selectedVersion) {
        onPlay();
      } else {
        setVersion(version);
      }
    },
    [selectedVersion, onPlay]
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
        {sayobot.map(b => (
          <BeatmapBar
            key={b.info.sid}
            beatmap={b.beatmap}
            expanded={selectedBeatmap === b.beatmap}
            onClick={onClick}
            onClickDiff={onClickDiff}
          />
        ))}
      </div>
    </div>
  );
}
