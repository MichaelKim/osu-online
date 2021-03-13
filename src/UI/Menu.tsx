import { useCallback, useState } from 'react';
import { BeatmapFile } from '../Game';
import { BeatmapData } from '../Game/Loader/BeatmapLoader';
import { SayobotBeatmapFiles } from './API/SayobotAPI';
import BeatmapListing from './Components/BeatmapListing';
import { BeatmapFiles } from './Components/BeatmapUpload';
import Header from './Components/Header';
import OptionsContext, { Options } from './options';

type Props = {
  options: Options & {
    setOptions: (o: Partial<Options>) => void;
  };
  onSelect: (data: BeatmapData, files: BeatmapFile[]) => void;
};

export default function Menu({ options, onSelect }: Props) {
  const [localBeatmaps, setLocalBeatmaps] = useState<BeatmapFiles[]>([]);
  const [sayobotBeatmaps, setSayobotBeatmaps] = useState<SayobotBeatmapFiles[]>(
    []
  );

  const onSayobotAdd = useCallback(
    (beatmap: SayobotBeatmapFiles) => setSayobotBeatmaps(b => [...b, beatmap]),
    []
  );

  return (
    <>
      <OptionsContext.Provider value={options}>
        <Header onLoad={setLocalBeatmaps} onSayobotAdd={onSayobotAdd} />
      </OptionsContext.Provider>
      <BeatmapListing
        beatmaps={localBeatmaps}
        sayobot={sayobotBeatmaps}
        onSelect={onSelect}
      />
    </>
  );
}
