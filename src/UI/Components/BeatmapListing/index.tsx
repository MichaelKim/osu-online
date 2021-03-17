import { useCallback, useMemo, useState } from 'react';
import { BeatmapFile } from '../../../Game';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import BeatmapBar, { BeatmapDiffBar } from '../BeatmapBar';
import barStyle from '../BeatmapBar/index.module.scss';
import BeatmapInfo from '../BeatmapInfo';
import { BeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';
import VirtualList from './VirtualList';

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

  const items = useMemo(() => {
    const items = [];

    for (const b of beatmaps) {
      const Bar = () => <BeatmapBar beatmap={b} onClick={onClick} />;
      items.push({
        bar: BeatmapBar,
        className: barStyle.bar,
        height: 126,
        key: b.info.id + '-' + b.info.title + '-' + b.info.creator,
        renderChild: Bar
      });

      if (selectedBeatmap === b) {
        for (const d of b.difficulties) {
          const DiffBar = () => (
            <BeatmapDiffBar
              beatmapID={b.info.id}
              creator={b.info.creator}
              diff={d.info}
              onClick={setVersion}
            />
          );
          items.push({
            className: barStyle.diff,
            height: 86,
            key: d.info.version,
            renderChild: DiffBar
          });
        }
      }
    }

    return items;
  }, [beatmaps, selectedBeatmap, onClick]);

  return (
    <div className={style.container}>
      <BeatmapInfo
        beatmap={selectedBeatmap}
        version={selectedVersion}
        onSelect={onPlay}
      />
      <VirtualList items={items} />
    </div>
  );
}
