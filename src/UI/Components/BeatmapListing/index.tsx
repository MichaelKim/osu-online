import * as React from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import LocalBeatmapBar from '../../Sources/Local/LocalBeatmapBar';
import BeatmapInfo from '../BeatmapInfo';
import { LocalBeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';

type Props = {
  beatmaps: LocalBeatmapFiles[];
  onSelect: (data: BeatmapData, files: BeatmapFile[]) => void;
};

export default function BeatmapListing({ beatmaps, onSelect }: Props) {
  // const [keyword, setKeyword] = React.useState('');
  const [selectedBeatmap, setSelected] = React.useState<LocalBeatmapFiles>();
  const [selectedVersion, setVersion] = React.useState<string>();

  // Find diff
  const diff = selectedBeatmap?.difficulties.find(
    d => d.version === selectedVersion
  );

  const onClick = React.useCallback(
    (beatmap: LocalBeatmapFiles) => {
      if (beatmap === selectedBeatmap) {
        return;
      }

      setSelected(beatmap);
      setVersion(beatmap.difficulties[0].version);
    },
    [selectedBeatmap]
  );

  const onPlay = React.useCallback(() => {
    if (diff == null || selectedBeatmap == null) return;

    onSelect(diff, selectedBeatmap.files);
  }, [diff, selectedBeatmap, onSelect]);

  const onClickDiff = React.useCallback(
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
      <BeatmapInfo diff={diff} onSelect={onPlay} />
      <div className={style.list}>
        {beatmaps.map(b => (
          <LocalBeatmapBar
            key={
              b.difficulties[0].beatmapSetID + '-' + b.difficulties[0].version
            }
            beatmap={b}
            onClick={onClick}
            onClickDiff={onClickDiff}
            expanded={selectedBeatmap === b}
          />
        ))}
      </div>
    </div>
    // <>
    //   <Local beatmaps={beatmaps} onSelect={onSelect} />
    //   <Section>
    //     <div className={style.header}>
    //       <h1>Beatmap Listing</h1>
    //     </div>
    //     <Search value={keyword} onChange={setKeyword} />
    //   </Section>
    //   <Section>
    //     <Sayobot search={keyword} onSelect={onSelect} />
    //   </Section>
    // </>
  );
}
