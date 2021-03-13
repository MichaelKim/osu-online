import { useCallback, useState } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import { SayobotBeatmapFiles } from '../../API/SayobotAPI';
import LocalBeatmapBar from '../../Sources/Local/LocalBeatmapBar';
import SayobotBeatmapBar from '../../Sources/Sayobot/SayobotBeatmapBar';
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
          <LocalBeatmapBar
            key={
              b.difficulties[0].data.beatmapSetID +
              '-' +
              b.difficulties[0].data.version
            }
            beatmap={b}
            onClick={onClick}
            onClickDiff={onClickDiff}
            expanded={selectedBeatmap === b}
          />
        ))}
        {sayobot.map(b => (
          <SayobotBeatmapBar
            key={b.info.sid}
            beatmap={b}
            onClick={onClick}
            onClickDiff={onClickDiff}
            expanded={selectedBeatmap === b.beatmap}
          />
        ))}
      </div>
    </div>
  );
}
