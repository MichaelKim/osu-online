import { useState } from 'react';
import { BeatmapData } from '../../../Game/Loader/BeatmapLoader';
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
  const [keyword, setKeyword] = useState('');

  return (
    <>
      <Section>
        <div className={style.header}>
          <h1>Beatmap Listing</h1>
        </div>
        <Search value={keyword} onChange={setKeyword} />
      </Section>
      <Section>
        <Sayobot search={keyword} onSelect={onSelect} />
      </Section>
    </>
  );
}
