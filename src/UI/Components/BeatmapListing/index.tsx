import React from 'react';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
import Local from '../../Sources/Local';
import Sayobot from '../../Sources/Sayobot';
import Search from '../Search';
import Section from '../Section';
import style from './index.module.scss';

type Props = {
  onSelect: (
    data: BeatmapData,
    files: {
      name: string;
      blob: Blob;
    }[]
  ) => void;
};

export default function BeatmapListing({ onSelect }: Props) {
  const [keyword, setKeyword] = React.useState('');
  const [showLocal, toggleLocal] = React.useState(false);

  const onToggle = React.useCallback(() => toggleLocal(l => !l), []);

  return (
    <>
      <Section>
        <div className={style.header}>
          <h1>Beatmap Listing</h1>
          <button className={style.toggleButton} onClick={onToggle}>
            {showLocal ? (
              <p>Hide Local Beatmaps</p>
            ) : (
              <p>Show Local Beatmaps</p>
            )}
          </button>
        </div>
        <Search value={keyword} onChange={setKeyword} />
      </Section>
      {showLocal && (
        <Section>
          <Local onSelect={onSelect} />
        </Section>
      )}
      <Section>
        <Sayobot search={keyword} onSelect={onSelect} />
      </Section>
    </>
  );
}
