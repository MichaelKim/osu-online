import { useEffect, useState } from 'react';
import { LocalBeatmapFiles } from '../../Components/BeatmapUpload';

export function useBackgroundImage(beatmap: LocalBeatmapFiles) {
  const [bg, setBg] = useState('');

  // Load background image
  const bgFilename = beatmap.difficulties[0]?.background.filename;
  const bgFile = beatmap.files.find(f => f.name === bgFilename);
  useEffect(() => {
    if (bgFile != null) {
      const objectURL = URL.createObjectURL(bgFile.blob);
      setBg(objectURL);
      return () => {
        URL.revokeObjectURL(objectURL);
      };
    }
  }, [bgFile]);

  return bg;
}
