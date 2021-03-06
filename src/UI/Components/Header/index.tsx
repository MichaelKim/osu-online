import React from 'react';
import BeatmapUpload, { LocalBeatmapFiles } from '../BeatmapUpload';
import style from './index.module.scss';

type Props = {
  onLoad: (beatmaps: LocalBeatmapFiles[]) => void;
};

export default function Header({ onLoad }: Props) {
  const [showModal, setModal] = React.useState(false);

  const onToggle = React.useCallback(() => setModal(m => !m), []);
  const onModalClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  );

  const _onLoad = React.useCallback(
    (beatmaps: LocalBeatmapFiles[]) => {
      setModal(false);
      onLoad(beatmaps);
    },
    [onLoad]
  );

  return (
    <div className={style.header}>
      <h1>osu!</h1>
      <button className={style.headerButton} onClick={onToggle}>
        Load Unpacked Beatmap
      </button>
      {showModal && (
        <div className={style.modal} onClick={onToggle}>
          <div className={style.modalBox} onClick={onModalClick}>
            <h1 className={style.title}>Load Unpacked Beatmap</h1>
            <p>Play beatmaps stored on your computer</p>
            <BeatmapUpload onSelect={_onLoad} />
          </div>
        </div>
      )}
    </div>
  );
}
