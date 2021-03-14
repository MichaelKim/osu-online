import { BeatmapFile } from '../../../Game';
import { BeatmapData, parseBeatmap } from '../../../Game/Loader/BeatmapLoader';
import { CheeseGullBeatmap, CheeseGullSet } from '../../API/CheeseGullAPI';
import { BeatmapFiles } from '../../Components/BeatmapUpload';
import { fetchOSZ } from '../../util';

function loadBeatmapInfo(
  data: BeatmapData,
  info: CheeseGullSet,
  diffInfo: CheeseGullBeatmap | undefined,
  files: BeatmapFile[]
) {
  // Load background image
  const bgFilename = data.background.filename;
  const bgFile = files.find(f => f.name === bgFilename);
  const background = bgFile != null ? URL.createObjectURL(bgFile.blob) : '';

  return {
    creator: info.Creator || data.creator,
    version: diffInfo?.DiffName || data.version,
    stars: diffInfo?.DifficultyRating || 0,
    background,
    length: diffInfo?.HitLength ?? 0
  };
}

export async function fetchRipple(
  cheeseGullInfo: CheeseGullSet
): Promise<BeatmapFiles> {
  const { diffFiles, otherFiles } = await fetchOSZ(
    'https://storage.ripple.moe/d/' + cheeseGullInfo.SetID
  );

  // Parse diffs
  const diffs = await Promise.all(
    diffFiles.map(async d => {
      const text = await d.blob.text();
      const data = parseBeatmap(text.split('\n').map(l => l.trim()));

      const diffInfo = cheeseGullInfo.ChildrenBeatmaps.find(
        d => d.DiffName === data.version
      );
      const info = loadBeatmapInfo(data, cheeseGullInfo, diffInfo, otherFiles);

      return {
        info,
        data
      };
    })
  );

  diffs.sort((a, b) => a.info.stars - b.info.stars);

  return {
    info: {
      id: cheeseGullInfo.SetID,
      title: cheeseGullInfo.Title,
      artist: cheeseGullInfo.Artist,
      creator: cheeseGullInfo.Creator,
      background: diffs[0].info.background
    },
    difficulties: diffs,
    files: otherFiles
  };
}
